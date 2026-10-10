package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.AdminSummaryDto;
import com.bloodlink.bloodlinkbackend.dto.UserDto;
import com.bloodlink.bloodlinkbackend.entity.BloodRequest;
import com.bloodlink.bloodlinkbackend.entity.DonorProfile;
import com.bloodlink.bloodlinkbackend.entity.Match;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.*;
import com.bloodlink.bloodlinkbackend.repository.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Admin Approval & Notification Workflow Tests")
class AdminApprovalWorkflowTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BloodRequestRepository bloodRequestRepository;

    @Mock
    private AdminAuditLogRepository adminAuditLogRepository;

    @Mock
    private DonorProfileRepository donorProfileRepository;

    @Mock
    private DuplicateDetectionService duplicateDetectionService;

    @Mock
    private RequestStatusTransitionService statusTransitionService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private BloodCompatibilityService compatibilityService;

    @InjectMocks
    private AdminService adminService;

    @Test
    @DisplayName("Admin approval transitions user to APPROVED and records admin audit trail")
    void testApproveUserSuccess() {
        User admin = User.builder().id(1L).email("admin@test.local").role(Role.ADMIN).build();
        User pendingUser = User.builder()
                .id(10L)
                .name("Pending Donor")
                .email("donor@test.local")
                .role(Role.DONOR)
                .active(true)
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
                .build();

        when(userRepository.findById(10L)).thenReturn(Optional.of(pendingUser));
        when(userRepository.findByEmail("admin@test.local")).thenReturn(Optional.of(admin));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserDto result = adminService.approveUser(10L, "admin@test.local");

        assertNotNull(result);
        assertEquals(ApprovalStatus.APPROVED, result.getApprovalStatus());
        assertNotNull(result.getApprovedAt());
        assertEquals("admin@test.local", result.getApprovedByEmail());

        verify(adminAuditLogRepository).save(any());
        verify(notificationService).createAndSendNotification(eq(pendingUser), isNull(), contains("Approved"), anyString(), eq(NotificationType.ACCOUNT_APPROVED));
    }

    @Test
    @DisplayName("Admin rejection transitions user to REJECTED with reason and records audit trail")
    void testRejectUserSuccess() {
        User admin = User.builder().id(1L).email("admin@test.local").role(Role.ADMIN).build();
        User pendingUser = User.builder()
                .id(11L)
                .name("Unverified Requester")
                .email("unverified@test.local")
                .role(Role.REQUESTER)
                .active(true)
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
                .build();

        when(userRepository.findById(11L)).thenReturn(Optional.of(pendingUser));
        when(userRepository.findByEmail("admin@test.local")).thenReturn(Optional.of(admin));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        UserDto result = adminService.rejectUser(11L, "Invalid medical credentials", "admin@test.local");

        assertNotNull(result);
        assertEquals(ApprovalStatus.REJECTED, result.getApprovalStatus());
        assertEquals("Invalid medical credentials", result.getRejectionReason());
        assertNotNull(result.getApprovedAt());

        verify(adminAuditLogRepository).save(any());
        verify(notificationService).createAndSendNotification(eq(pendingUser), isNull(), contains("Not Approved"), anyString(), eq(NotificationType.ACCOUNT_REJECTED));
    }

    @Test
    @DisplayName("Admin summary computes pending and approved counts accurately")
    void testAdminSummaryCounts() {
        when(userRepository.count()).thenReturn(10L);
        when(userRepository.countByApprovalStatus(ApprovalStatus.PENDING_APPROVAL)).thenReturn(3L);
        when(userRepository.countByApprovalStatus(ApprovalStatus.APPROVED)).thenReturn(6L);
        when(userRepository.countByApprovalStatus(ApprovalStatus.REJECTED)).thenReturn(1L);
        when(donorProfileRepository.countByAvailabilityStatus(AvailabilityStatus.AVAILABLE)).thenReturn(4L);
        when(bloodRequestRepository.countActiveRequests(any())).thenReturn(2L);
        when(bloodRequestRepository.count()).thenReturn(5L);
        when(bloodRequestRepository.findActiveRequests(any())).thenReturn(Collections.emptyList());
        when(notificationService.getUnreadCount("admin@test.local")).thenReturn(2L);

        AdminSummaryDto summary = adminService.getSummary("admin@test.local");

        assertNotNull(summary);
        assertEquals(10L, summary.getTotalUsers());
        assertEquals(3L, summary.getPendingRegistrations());
        assertEquals(6L, summary.getApprovedUsers());
        assertEquals(1L, summary.getRejectedUsers());
        assertEquals(4L, summary.getActiveDonors());
        assertEquals(2L, summary.getActiveRequests());
        assertEquals(2L, summary.getUnreadAdminNotifications());
    }

    @Test
    @DisplayName("Only APPROVED and active donors participate in matching; pending/rejected donors are skipped")
    void testMatchingFiltersOutUnapprovedDonors() {
        MatchingService localMatchingService = new MatchingService(
                compatibilityService,
                donorProfileRepository,
                matchRepository,
                bloodRequestRepository,
                notificationService
        );

        BloodRequest request = BloodRequest.builder()
                .id(100L)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .urgency(Urgency.NORMAL)
                .status(RequestStatus.OPEN)
                .hospitalName("City Hospital")
                .city("Hyderabad")
                .unitsRequired(2)
                .latitude(17.3850)
                .longitude(78.4867)
                .expiresAt(LocalDateTime.now().plusHours(12))
                .build();

        // 1. Approved donor
        User approvedUser = User.builder().id(20L).active(true).approvalStatus(ApprovalStatus.APPROVED).build();
        DonorProfile approvedDonor = DonorProfile.builder()
                .id(200L)
                .user(approvedUser)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .city("Hyderabad")
                .latitude(17.3850)
                .longitude(78.4867)
                .build();

        // 2. Pending donor
        User pendingUser = User.builder().id(21L).active(true).approvalStatus(ApprovalStatus.PENDING_APPROVAL).build();
        DonorProfile pendingDonor = DonorProfile.builder()
                .id(201L)
                .user(pendingUser)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .city("Hyderabad")
                .latitude(17.3850)
                .longitude(78.4867)
                .build();

        // 3. Rejected donor
        User rejectedUser = User.builder().id(22L).active(true).approvalStatus(ApprovalStatus.REJECTED).build();
        DonorProfile rejectedDonor = DonorProfile.builder()
                .id(202L)
                .user(rejectedUser)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .city("Hyderabad")
                .latitude(17.3850)
                .longitude(78.4867)
                .build();

        when(compatibilityService.getCompatibleDonorGroups(BloodGroup.O_POSITIVE))
                .thenReturn(Set.of(BloodGroup.O_POSITIVE, BloodGroup.O_NEGATIVE));
        when(donorProfileRepository.findCompatibleAvailableDonors(any(), eq(AvailabilityStatus.AVAILABLE)))
                .thenReturn(List.of(approvedDonor, pendingDonor, rejectedDonor));
        when(matchRepository.existsByRequestIdAndDonorId(anyLong(), anyLong())).thenReturn(false);
        when(matchRepository.save(any(Match.class))).thenAnswer(i -> i.getArgument(0));

        List<Match> matches = localMatchingService.matchDonorsForRequest(request);

        // Only the approved donor should have a match created
        assertEquals(1, matches.size());
        assertEquals(200L, matches.get(0).getDonor().getId());

        // Verify notification sent ONLY to approved donor
        verify(notificationService, times(1)).createAndSendNotification(
                eq(approvedUser),
                eq(100L),
                contains("Potential Blood Requirement Match"),
                anyString(),
                eq(NotificationType.NEW_MATCH)
        );
        verify(notificationService, never()).createAndSendNotification(eq(pendingUser), any(), any(), any(), any());
        verify(notificationService, never()).createAndSendNotification(eq(rejectedUser), any(), any(), any(), any());
    }
}
