package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.MatchDto;
import com.bloodlink.bloodlinkbackend.dto.MatchResponseDto;
import com.bloodlink.bloodlinkbackend.entity.BloodRequest;
import com.bloodlink.bloodlinkbackend.entity.Match;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.MatchStatus;
import com.bloodlink.bloodlinkbackend.enums.NotificationType;
import com.bloodlink.bloodlinkbackend.enums.RequestStatus;
import com.bloodlink.bloodlinkbackend.enums.Role;
import com.bloodlink.bloodlinkbackend.exception.BadRequestException;
import com.bloodlink.bloodlinkbackend.exception.ForbiddenException;
import com.bloodlink.bloodlinkbackend.exception.ResourceNotFoundException;
import com.bloodlink.bloodlinkbackend.mapper.EntityMapper;
import com.bloodlink.bloodlinkbackend.repository.BloodRequestRepository;
import com.bloodlink.bloodlinkbackend.repository.MatchRepository;
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
public class MatchService {

    private final MatchRepository matchRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<MatchDto> getMatchesForRequest(Long requestId, String email) {
        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with ID: " + requestId));

        User currentUser = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (!request.getRequester().getId().equals(currentUser.getId()) && currentUser.getRole() != Role.ADMIN) {
            throw new ForbiddenException("You are not authorized to view matches for this blood request");
        }

        return matchRepository.findByRequestIdOrderByDistanceKmAsc(requestId)
                .stream()
                .map(EntityMapper::toMatchDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MatchDto> getMyMatches(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        return matchRepository.findByDonorUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(EntityMapper::toMatchDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public MatchDto respondToMatch(Long matchId, String email, MatchResponseDto dto) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match record not found with ID: " + matchId));

        User currentUser = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        // Enforce ownership: only the donor assigned to this match can respond
        if (match.getDonor() == null || match.getDonor().getUser() == null ||
                !match.getDonor().getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("You are not authorized to respond to this match");
        }

        BloodRequest request = match.getRequest();
        if (request == null || request.getStatus() == RequestStatus.CLOSED ||
                request.getStatus() == RequestStatus.EXPIRED || request.getStatus() == RequestStatus.CANCELLED) {
            throw new BadRequestException("This blood request is no longer active");
        }

        MatchStatus newResponse = dto.getResponse();
        if (newResponse != MatchStatus.ACCEPTED && newResponse != MatchStatus.DECLINED) {
            throw new BadRequestException("Response must be either ACCEPTED or DECLINED");
        }

        match.setResponseStatus(newResponse);
        match.setRespondedAt(LocalDateTime.now());
        Match savedMatch = matchRepository.save(match);

        // If donor accepted, advance request status to RESPONDED if still in OPEN/MATCHING
        if (newResponse == MatchStatus.ACCEPTED) {
            if (request.getStatus() == RequestStatus.OPEN || request.getStatus() == RequestStatus.MATCHING) {
                request.setStatus(RequestStatus.RESPONDED);
                request.setUpdatedAt(LocalDateTime.now());
                bloodRequestRepository.save(request);
            }

            // Notify requester immediately
            String donorName = currentUser.getName();
            String donorPhone = currentUser.getPhone() != null ? currentUser.getPhone() : "Not provided";
            String title = "Donor Response: Potential Match Accepted";
            String message = String.format(
                    "Potential donor %s has ACCEPTED your blood request #%d for %s at %s. Contact: %s. " +
                    "Important: Final compatibility testing and medical cross-matching must be conducted at the hospital prior to transfusion.",
                    donorName, request.getId(), request.getBloodGroup().getLabel(), request.getHospitalName(), donorPhone
            );

            notificationService.createAndSendNotification(
                    request.getRequester(),
                    request.getId(),
                    title,
                    message,
                    NotificationType.DONOR_ACCEPTED
            );
        } else {
            // Donor declined
            String title = "Donor Response: Match Declined";
            String message = String.format("A potential donor declined blood request #%d. The system continues to match other available donors.",
                    request.getId());

            notificationService.createAndSendNotification(
                    request.getRequester(),
                    request.getId(),
                    title,
                    message,
                    NotificationType.DONOR_DECLINED
            );
        }

        MatchDto resultDto = EntityMapper.toMatchDto(savedMatch);

        // Broadcast real-time match update
        try {
            messagingTemplate.convertAndSend("/topic/requests." + request.getId() + ".matches", resultDto);
        } catch (Exception ex) {
            log.warn("Failed to broadcast match response via WebSocket: {}", ex.getMessage());
        }

        return resultDto;
    }
}
