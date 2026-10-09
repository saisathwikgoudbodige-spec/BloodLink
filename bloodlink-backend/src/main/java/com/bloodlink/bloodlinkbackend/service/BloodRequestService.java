package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.BloodRequestDto;
import com.bloodlink.bloodlinkbackend.dto.BloodRequestUpdateDto;
import com.bloodlink.bloodlinkbackend.dto.CreateBloodRequestDto;
import com.bloodlink.bloodlinkbackend.dto.RequestStatusUpdateDto;
import com.bloodlink.bloodlinkbackend.entity.BloodRequest;
import com.bloodlink.bloodlinkbackend.entity.Match;
import com.bloodlink.bloodlinkbackend.entity.RequestHistory;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.NotificationType;
import com.bloodlink.bloodlinkbackend.enums.RequestStatus;
import com.bloodlink.bloodlinkbackend.enums.Role;
import com.bloodlink.bloodlinkbackend.exception.BadRequestException;
import com.bloodlink.bloodlinkbackend.exception.ForbiddenException;
import com.bloodlink.bloodlinkbackend.exception.ResourceNotFoundException;
import com.bloodlink.bloodlinkbackend.mapper.EntityMapper;
import com.bloodlink.bloodlinkbackend.repository.BloodRequestRepository;
import com.bloodlink.bloodlinkbackend.repository.RequestHistoryRepository;
import com.bloodlink.bloodlinkbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BloodRequestService {

    private final BloodRequestRepository bloodRequestRepository;
    private final UserRepository userRepository;
    private final RequestHistoryRepository requestHistoryRepository;
    private final MatchingService matchingService;
    private final RequestStatusTransitionService statusTransitionService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public BloodRequestDto createRequest(String email, CreateBloodRequestDto dto) {
        User requester = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Requester user not found: " + email));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = dto.getExpiresAt();

        if (expiresAt == null) {
            int hours = dto.getExpiresInHours() != null ? dto.getExpiresInHours() : switch (dto.getUrgency()) {
                case CRITICAL -> 6;
                case HIGH -> 12;
                case NORMAL -> 24;
            };
            expiresAt = now.plusHours(hours);
        }

        if (expiresAt.isBefore(now)) {
            throw new BadRequestException("Request expiry time must be in the future");
        }

        BloodRequest request = BloodRequest.builder()
                .requester(requester)
                .bloodGroup(dto.getBloodGroup())
                .unitsRequired(dto.getUnitsRequired())
                .hospitalName(dto.getHospitalName().trim())
                .city(dto.getCity().trim())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .urgency(dto.getUrgency())
                .expiresAt(expiresAt)
                .status(RequestStatus.OPEN)
                .createdAt(now)
                .updatedAt(now)
                .build();

        BloodRequest savedRequest = bloodRequestRepository.save(request);

        // Record initial status history
        recordHistory(savedRequest, null, RequestStatus.OPEN, requester, "Blood request initiated");

        // Run matching engine to identify and notify compatible donors
        List<Match> matches = matchingService.matchDonorsForRequest(savedRequest);

        // Broadcast new request to websocket topic
        try {
            messagingTemplate.convertAndSend("/topic/requests", EntityMapper.toBloodRequestDto(savedRequest));
        } catch (Exception ex) {
            log.warn("Failed to broadcast request to WebSocket: {}", ex.getMessage());
        }

        log.info("Blood request ID {} created by {} with {} initial matches",
                savedRequest.getId(), email, matches.size());

        return EntityMapper.toBloodRequestDto(savedRequest);
    }

    @Transactional(readOnly = true)
    public List<BloodRequestDto> getMyRequests(String email) {
        return bloodRequestRepository.findByRequesterEmailOrderByCreatedAtDesc(email.toLowerCase())
                .stream()
                .map(EntityMapper::toBloodRequestDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BloodRequestDto> getAllRequests() {
        return bloodRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(EntityMapper::toBloodRequestDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BloodRequestDto> getActiveRequests() {
        return bloodRequestRepository.findActiveRequests(LocalDateTime.now())
                .stream()
                .map(EntityMapper::toBloodRequestDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BloodRequestDto getRequestById(Long id) {
        BloodRequest request = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with ID: " + id));
        return EntityMapper.toBloodRequestDto(request);
    }

    @Transactional
    public BloodRequestDto updateRequest(Long id, String email, BloodRequestUpdateDto dto) {
        BloodRequest request = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with ID: " + id));

        User currentUser = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        // Enforce ownership: only the owner or an ADMIN can update
        if (!request.getRequester().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You do not have permission to modify this blood request");
        }

        if (request.getStatus() == RequestStatus.CLOSED || request.getStatus() == RequestStatus.EXPIRED) {
            throw new BadRequestException("Cannot update a closed or expired blood request");
        }

        boolean bloodGroupChanged = false;
        if (dto.getBloodGroup() != null && dto.getBloodGroup() != request.getBloodGroup()) {
            request.setBloodGroup(dto.getBloodGroup());
            bloodGroupChanged = true;
        }

        if (dto.getUnitsRequired() != null) request.setUnitsRequired(dto.getUnitsRequired());
        if (dto.getHospitalName() != null) request.setHospitalName(dto.getHospitalName().trim());
        if (dto.getCity() != null) request.setCity(dto.getCity().trim());
        if (dto.getLatitude() != null) request.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) request.setLongitude(dto.getLongitude());
        if (dto.getUrgency() != null) request.setUrgency(dto.getUrgency());
        if (dto.getExpiresAt() != null) request.setExpiresAt(dto.getExpiresAt());

        request.setUpdatedAt(LocalDateTime.now());
        BloodRequest updated = bloodRequestRepository.save(request);

        // If blood group changed, re-run matching engine
        if (bloodGroupChanged) {
            matchingService.matchDonorsForRequest(updated);
        }

        return EntityMapper.toBloodRequestDto(updated);
    }

    @Transactional
    public BloodRequestDto updateStatus(Long id, String email, RequestStatusUpdateDto dto) {
        BloodRequest request = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with ID: " + id));

        User currentUser = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        // Enforce ownership
        if (!request.getRequester().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You do not have permission to alter the status of this blood request");
        }

        RequestStatus oldStatus = request.getStatus();
        RequestStatus newStatus = dto.getStatus();

        if (oldStatus == newStatus) {
            return EntityMapper.toBloodRequestDto(request);
        }

        // Enforce valid state machine transitions
        statusTransitionService.validateTransition(oldStatus, newStatus);

        request.setStatus(newStatus);
        request.setUpdatedAt(LocalDateTime.now());
        BloodRequest updated = bloodRequestRepository.save(request);

        recordHistory(updated, oldStatus, newStatus, currentUser, dto.getReason());

        // Notify matched donors if request is fulfilled or cancelled
        if (newStatus == RequestStatus.FULFILLED || newStatus == RequestStatus.CANCELLED || newStatus == RequestStatus.CLOSED) {
            NotificationType notifType = newStatus == RequestStatus.FULFILLED
                    ? NotificationType.REQUEST_FULFILLED
                    : NotificationType.REQUEST_CANCELLED;

            String message = String.format("Request #%d for %s blood at %s is now marked as %s.",
                    request.getId(), request.getBloodGroup().getLabel(), request.getHospitalName(), newStatus);

            if (request.getMatches() != null) {
                request.getMatches().forEach(match -> {
                    if (match.getDonor() != null && match.getDonor().getUser() != null) {
                        notificationService.createAndSendNotification(
                                match.getDonor().getUser(),
                                request.getId(),
                                "Blood Request Update: " + newStatus,
                                message,
                                notifType
                        );
                    }
                });
            }
        }

        return EntityMapper.toBloodRequestDto(updated);
    }

    @Transactional
    public void deleteRequest(Long id, String email) {
        BloodRequest request = bloodRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with ID: " + id));

        User currentUser = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (!request.getRequester().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You do not have permission to delete this blood request");
        }

        RequestStatus oldStatus = request.getStatus();
        request.setStatus(RequestStatus.CANCELLED);
        request.setUpdatedAt(LocalDateTime.now());
        bloodRequestRepository.save(request);

        recordHistory(request, oldStatus, RequestStatus.CANCELLED, currentUser, "Request cancelled/deleted by user or admin");
    }

    private void recordHistory(BloodRequest request, RequestStatus oldStatus, RequestStatus newStatus, User changedBy, String reason) {
        RequestHistory history = RequestHistory.builder()
                .request(request)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .changedAt(LocalDateTime.now())
                .reason(reason)
                .build();
        requestHistoryRepository.save(history);
    }
}
