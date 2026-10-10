package com.bloodlink.bloodlinkbackend.security;

import com.bloodlink.bloodlinkbackend.dto.NotificationDto;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.ApprovalStatus;
import com.bloodlink.bloodlinkbackend.enums.NotificationType;
import com.bloodlink.bloodlinkbackend.enums.Role;
import com.bloodlink.bloodlinkbackend.repository.NotificationRepository;
import com.bloodlink.bloodlinkbackend.repository.UserRepository;
import com.bloodlink.bloodlinkbackend.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Security & Notification Safety Tests")
class SecurityAndWebSocketTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    @DisplayName("Deduplication prevents duplicate notification records for same user, request and type")
    void testNotificationDeduplication() {
        User user = User.builder().id(5L).email("user@test.local").role(Role.DONOR).build();

        // 1. First attempt: does not exist yet -> should save and send
        when(notificationRepository.existsByUserIdAndRequestIdAndType(5L, 100L, NotificationType.NEW_MATCH))
                .thenReturn(false);
        when(notificationRepository.save(any())).thenAnswer(i -> {
            var n = i.getArgument(0);
            return n;
        });

        NotificationDto first = notificationService.createAndSendNotification(
                user, 100L, "Match Alert", "You have a potential match", NotificationType.NEW_MATCH
        );
        assertNotNull(first);
        verify(notificationRepository, times(1)).save(any());

        // 2. Second attempt (retry/duplicate): already exists -> should return null without saving duplicate
        when(notificationRepository.existsByUserIdAndRequestIdAndType(5L, 100L, NotificationType.NEW_MATCH))
                .thenReturn(true);

        NotificationDto second = notificationService.createAndSendNotification(
                user, 100L, "Match Alert", "You have a potential match", NotificationType.NEW_MATCH
        );
        assertNull(second, "Duplicate notification must be suppressed");
        // Verify save was not called a second time
        verify(notificationRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Notification failure does not corrupt request state or throw uncaught exception")
    void testNotificationFailureResilience() {
        User user = User.builder().id(6L).email("user6@test.local").role(Role.DONOR).build();

        when(notificationRepository.existsByUserIdAndRequestIdAndType(anyLong(), anyLong(), any()))
                .thenReturn(false);
        when(notificationRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        doThrow(new RuntimeException("Simulated WebSocket broker connection failure"))
                .when(messagingTemplate).convertAndSend(anyString(), any(Object.class));

        // Should handle WebSocket delivery failure gracefully without blowing up
        assertDoesNotThrow(() -> {
            NotificationDto dto = notificationService.createAndSendNotification(
                    user, 200L, "Alert", "Test alert", NotificationType.NEW_MATCH
            );
            assertNotNull(dto);
        });
    }
}
