package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.NotificationDto;
import com.bloodlink.bloodlinkbackend.entity.Notification;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.NotificationType;
import com.bloodlink.bloodlinkbackend.enums.Role;
import com.bloodlink.bloodlinkbackend.exception.ResourceNotFoundException;
import com.bloodlink.bloodlinkbackend.mapper.EntityMapper;
import com.bloodlink.bloodlinkbackend.repository.NotificationRepository;
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
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public NotificationDto createAndSendNotification(User user, Long requestId, String title, String message, NotificationType type) {
        if (user == null) {
            return null;
        }

        // Deduplication check: prevent duplicate notifications of same type for same user and request
        if (requestId != null && notificationRepository.existsByUserIdAndRequestIdAndType(user.getId(), requestId, type)) {
            log.info("Duplicate notification suppressed for user #{} on request #{} of type {}", user.getId(), requestId, type);
            return null;
        }

        Notification notification = Notification.builder()
                .user(user)
                .requestId(requestId)
                .title(title)
                .message(message)
                .type(type)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDto dto = EntityMapper.toNotificationDto(saved);

        // Send real-time notification via STOMP / WebSocket (Targeted, non-leaking destinations)
        try {
            // Push to individual user channel
            messagingTemplate.convertAndSend("/topic/user." + user.getId() + ".notifications", dto);

            // If notification is for an ADMIN, also push to the dedicated admin topic
            if (user.getRole() == Role.ADMIN) {
                messagingTemplate.convertAndSend("/topic/admin.notifications", dto);
            }
        } catch (Exception ex) {
            log.warn("Failed to deliver WebSocket message for notification id {}: {}", saved.getId(), ex.getMessage());
        }

        return dto;
    }

    @Transactional
    public void notifyAdmins(Long requestId, String title, String message, NotificationType type) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            createAndSendNotification(admin, requestId, title, message, type);
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUserNotifications(String email) {
        return notificationRepository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(EntityMapper::toNotificationDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        return notificationRepository.countByUserEmailAndIsReadFalse(email);
    }

    @Transactional
    public NotificationDto markAsRead(Long id, String email) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        if (!notification.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new ResourceNotFoundException("Notification not found for current user");
        }

        notification.setRead(true);
        Notification updated = notificationRepository.save(notification);
        return EntityMapper.toNotificationDto(updated);
    }

    @Transactional
    public void markAllAsRead(String email) {
        List<Notification> unreadList = notificationRepository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .filter(n -> !n.isRead())
                .peek(n -> n.setRead(true))
                .collect(Collectors.toList());
        notificationRepository.saveAll(unreadList);
    }
}
