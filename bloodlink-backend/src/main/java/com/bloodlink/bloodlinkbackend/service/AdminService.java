package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.BloodRequestDto;
import com.bloodlink.bloodlinkbackend.dto.UserDto;
import com.bloodlink.bloodlinkbackend.entity.AdminAuditLog;
import com.bloodlink.bloodlinkbackend.entity.BloodRequest;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.exception.ResourceNotFoundException;
import com.bloodlink.bloodlinkbackend.mapper.EntityMapper;
import com.bloodlink.bloodlinkbackend.repository.AdminAuditLogRepository;
import com.bloodlink.bloodlinkbackend.repository.BloodRequestRepository;
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
    private final DuplicateDetectionService duplicateDetectionService;

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(EntityMapper::toUserDto)
                .collect(Collectors.toList());
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
