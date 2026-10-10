package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.AdminSummaryDto;
import com.bloodlink.bloodlinkbackend.dto.BloodRequestDto;
import com.bloodlink.bloodlinkbackend.dto.UserDto;
import com.bloodlink.bloodlinkbackend.entity.AdminAuditLog;
import com.bloodlink.bloodlinkbackend.entity.BloodRequest;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.*;
import com.bloodlink.bloodlinkbackend.exception.BadRequestException;
import com.bloodlink.bloodlinkbackend.exception.ResourceNotFoundException;
import com.bloodlink.bloodlinkbackend.mapper.EntityMapper;
import com.bloodlink.bloodlinkbackend.repository.AdminAuditLogRepository;
import com.bloodlink.bloodlinkbackend.repository.BloodRequestRepository;
import com.bloodlink.bloodlinkbackend.repository.DonorProfileRepository;
import com.bloodlink.bloodlinkbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final DuplicateDetectionService duplicateDetectionService;
    private final RequestStatusTransitionService statusTransitionService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(EntityMapper::toUserDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return EntityMapper.toUserDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getPendingUsers() {
        return userRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.PENDING_APPROVAL)
                .stream()
                .map(EntityMapper::toUserDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto approveUser(Long userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        User admin = userRepository.findByEmail(adminEmail.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));

        if (user.getApprovalStatus() == ApprovalStatus.APPROVED) {
            return EntityMapper.toUserDto(user);
        }

        user.setApprovalStatus(ApprovalStatus.APPROVED);
        user.setActive(true);
        user.setApprovedAt(LocalDateTime.now());
        user.setApprovedBy(admin);
        user.setRejectionReason(null);
        user.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);

        // Audit log
        logAction(
                admin,
                "APPROVE_USER",
                "USER",
                userId,
                String.format("Approved registration for %s (%s, %s) by admin %s",
                        saved.getName(), saved.getEmail(), saved.getRole(), admin.getEmail())
        );

        // Notify user about approval
        try {
            notificationService.createAndSendNotification(
                    saved,
                    null,
                    "Account Registration Approved",
                    "Congratulations! Your BloodLink account registration has been reviewed and approved. You can now log in and access your portal.",
                    NotificationType.ACCOUNT_APPROVED
            );
        } catch (Exception ex) {
            log.warn("Failed to notify user #{} of approval: {}", saved.getId(), ex.getMessage());
        }

        return EntityMapper.toUserDto(saved);
    }

    @Transactional
    public UserDto rejectUser(Long userId, String reason, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        User admin = userRepository.findByEmail(adminEmail.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));

        String finalReason = (reason != null && !reason.trim().isEmpty())
                ? reason.trim()
                : "Did not meet registration or verification requirements";

        user.setApprovalStatus(ApprovalStatus.REJECTED);
        user.setApprovedAt(LocalDateTime.now());
        user.setApprovedBy(admin);
        user.setRejectionReason(finalReason);
        user.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);

        // Audit log
        logAction(
                admin,
                "REJECT_USER",
                "USER",
                userId,
                String.format("Rejected registration for %s (%s). Reason: %s",
                        saved.getName(), saved.getEmail(), finalReason)
        );

        // Notify user where possible
        try {
            notificationService.createAndSendNotification(
                    saved,
                    null,
                    "Registration Not Approved",
                    "Your BloodLink account registration was not approved. Reason: " + finalReason,
                    NotificationType.ACCOUNT_REJECTED
            );
        } catch (Exception ex) {
            log.warn("Failed to notify user #{} of rejection: {}", saved.getId(), ex.getMessage());
        }

        return EntityMapper.toUserDto(saved);
    }

    @Transactional
    public UserDto toggleUserStatus(Long userId, boolean active, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        User admin = userRepository.findByEmail(adminEmail.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));

        user.setActive(active);
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);

        // Record audit log
        logAction(
                admin,
                active ? "ACTIVATE_USER" : "DEACTIVATE_USER",
                "USER",
                userId,
                String.format("User %s (%s) was %s by admin %s",
                        user.getName(), user.getEmail(), active ? "activated" : "deactivated", admin.getEmail())
        );

        return EntityMapper.toUserDto(saved);
    }

    @Transactional(readOnly = true)
    public List<BloodRequestDto> getAllRequests() {
        return bloodRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(EntityMapper::toBloodRequestDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BloodRequestDto> getFilteredRequests(RequestStatus status, Urgency urgency, BloodGroup bloodGroup) {
        return bloodRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(r -> status == null || r.getStatus() == status)
                .filter(r -> urgency == null || r.getUrgency() == urgency)
                .filter(r -> bloodGroup == null || r.getBloodGroup() == bloodGroup)
                .map(EntityMapper::toBloodRequestDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BloodRequestDto updateRequestStatus(Long requestId, RequestStatus newStatus, String reason, String adminEmail) {
        BloodRequest request = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found with ID: " + requestId));

        User admin = userRepository.findByEmail(adminEmail.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminEmail));

        RequestStatus oldStatus = request.getStatus();
        if (oldStatus == newStatus) {
            return EntityMapper.toBloodRequestDto(request);
        }

        // Validate state machine transition
        statusTransitionService.validateTransition(oldStatus, newStatus);

        request.setStatus(newStatus);
        request.setUpdatedAt(LocalDateTime.now());
        BloodRequest updated = bloodRequestRepository.save(request);

        logAction(
                admin,
                "UPDATE_REQUEST_STATUS",
                "BLOOD_REQUEST",
                requestId,
                String.format("Changed request #%d status from %s to %s. Reason: %s",
                        requestId, oldStatus, newStatus, reason != null ? reason : "Admin intervention")
        );

        return EntityMapper.toBloodRequestDto(updated);
    }

    @Transactional(readOnly = true)
    public AdminSummaryDto getSummary(String adminEmail) {
        long totalUsers = userRepository.count();
        long pending = userRepository.countByApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        long approved = userRepository.countByApprovalStatus(ApprovalStatus.APPROVED);
        long rejected = userRepository.countByApprovalStatus(ApprovalStatus.REJECTED);
        long activeDonors = donorProfileRepository.countByAvailabilityStatus(AvailabilityStatus.AVAILABLE);
        long activeRequests = bloodRequestRepository.countActiveRequests(LocalDateTime.now());
        long totalRequests = bloodRequestRepository.count();

        // Calculate potential duplicates
        long potentialDuplicates = bloodRequestRepository.findActiveRequests(LocalDateTime.now()).stream()
                .filter(r -> !duplicateDetectionService.detectPotentialDuplicates(r).isEmpty())
                .count();

        long unreadNotifications = notificationService.getUnreadCount(adminEmail);

        return AdminSummaryDto.builder()
                .totalUsers(totalUsers)
                .pendingRegistrations(pending)
                .approvedUsers(approved)
                .rejectedUsers(rejected)
                .activeDonors(activeDonors)
                .activeRequests(activeRequests)
                .totalRequests(totalRequests)
                .potentialDuplicatesCount(potentialDuplicates)
                .unreadAdminNotifications(unreadNotifications)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminAuditLog> getAuditLogs() {
        return adminAuditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<BloodRequestDto> findPotentialDuplicates(Long requestId) {
        BloodRequest target = bloodRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Blood request not found: " + requestId));

        return duplicateDetectionService.detectPotentialDuplicates(target);
    }

    public void logAction(User admin, String action, String targetType, Long targetId, String description) {
        AdminAuditLog auditLog = AdminAuditLog.builder()
                .adminUser(admin)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .description(description)
                .createdAt(LocalDateTime.now())
                .build();
        adminAuditLogRepository.save(auditLog);
    }
}
