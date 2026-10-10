package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.*;
import com.bloodlink.bloodlinkbackend.entity.*;
import com.bloodlink.bloodlinkbackend.enums.*;
import com.bloodlink.bloodlinkbackend.exception.BadRequestException;
import com.bloodlink.bloodlinkbackend.repository.*;
import com.bloodlink.bloodlinkbackend.security.CustomUserDetailsService;
import com.bloodlink.bloodlinkbackend.security.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Single Login Dual Dashboard Workflow Tests (Section 11 Compliance)")
class SingleLoginDualDashboardWorkflowTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DonorProfileRepository donorProfileRepository;

    @Mock
    private BloodRequestRepository bloodRequestRepository;

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private AdminAuditLogRepository adminAuditLogRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AuthService authService;

    @InjectMocks
    private AdminService adminService;

    @InjectMocks
    private DonorService donorService;

    @InjectMocks
    private DashboardService dashboardService;

    // Requirement 1 & 2: User can register only once with unique email, produces pending account
    @Test
    @DisplayName("Req 1 & 2: New registration produces PENDING_APPROVAL and duplicate email is rejected")
    void testRegistrationUniqueEmailAndPendingApproval() {
        RegisterRequest validRequest = RegisterRequest.builder()
                .name("Alex Care")
                .email("alex@care.local")
                .password("Secret123!")
                .phone("+91-9988776655")
                .role(Role.USER)
                .build();

        when(userRepository.existsByEmail("alex@care.local")).thenReturn(false);
        when(passwordEncoder.encode("Secret123!")).thenReturn("encoded_pass");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(101L);
            return u;
        });

        AuthResponse response = authService.register(validRequest);
        assertNotNull(response);
        assertNull(response.getToken(), "Pending user must not receive active JWT");
        assertEquals(ApprovalStatus.PENDING_APPROVAL, response.getUser().getApprovalStatus());

        // Duplicate registration must fail
        when(userRepository.existsByEmail("alex@care.local")).thenReturn(true);
        assertThrows(BadRequestException.class, () -> authService.register(validRequest));
    }

    // Requirement 3: Pending or rejected user cannot log in
    @Test
    @DisplayName("Req 3: Pending or rejected user cannot log in")
    void testPendingOrRejectedUserCannotLogin() {
        User pending = User.builder()
                .id(1L).email("pending@user.local").approvalStatus(ApprovalStatus.PENDING_APPROVAL).active(true).build();
        User rejected = User.builder()
                .id(2L).email("rejected@user.local").approvalStatus(ApprovalStatus.REJECTED).rejectionReason("Doc mismatch").active(true).build();

        when(userRepository.findByEmail("pending@user.local")).thenReturn(Optional.of(pending));
        when(userRepository.findByEmail("rejected@user.local")).thenReturn(Optional.of(rejected));

        assertThrows(BadRequestException.class, () -> authService.login(new LoginRequest("pending@user.local", "Pass123!")));
        assertThrows(BadRequestException.class, () -> authService.login(new LoginRequest("rejected@user.local", "Pass123!")));
        verify(authenticationManager, never()).authenticate(any());
    }

    // Requirement 4 & 6: Approved user logs in once and accesses both requester and donor dashboard APIs with same JWT
    @Test
    @DisplayName("Req 4 & 6: Approved user receives authorities for BOTH requester and donor portals with single login")
    void testApprovedUserHasBothAuthoritiesWithoutDashboardSwitchLogout() {
        User approvedUser = User.builder()
                .id(50L)
                .name("Kavitha Reddy")
                .email("kavitha@bloodlink.local")
                .password("encoded_pass")
                .role(Role.USER)
                .active(true)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();

        CustomUserDetailsService realDetailsService = new CustomUserDetailsService(userRepository);
        when(userRepository.findByEmail("kavitha@bloodlink.local")).thenReturn(Optional.of(approvedUser));

        UserDetails details = realDetailsService.loadUserByUsername("kavitha@bloodlink.local");
        assertNotNull(details);

        Set<String> authorityNames = new HashSet<>();
        for (GrantedAuthority ga : details.getAuthorities()) {
            authorityNames.add(ga.getAuthority());
        }

        // Must possess ROLE_USER, ROLE_REQUESTER, and ROLE_DONOR simultaneously!
        assertTrue(authorityNames.contains("ROLE_USER"), "Must have ROLE_USER");
        assertTrue(authorityNames.contains("ROLE_REQUESTER"), "Must have ROLE_REQUESTER for Requester Dashboard");
        assertTrue(authorityNames.contains("ROLE_DONOR"), "Must have ROLE_DONOR for Donor Dashboard");
        assertFalse(authorityNames.contains("ROLE_ADMIN"), "Must NOT have ROLE_ADMIN");
    }

    // Requirement 5: Completing a donor profile does not create a second user account
    @Test
    @DisplayName("Req 5: Completing a donor profile links to the existing user ID without second account")
    void testCompletingDonorProfileUsesExistingUser() {
        User existingUser = User.builder()
                .id(75L)
                .name("Ramesh")
                .email("ramesh@test.local")
                .role(Role.USER)
                .approvalStatus(ApprovalStatus.APPROVED)
                .active(true)
                .build();

        when(donorProfileRepository.findByUserEmail("ramesh@test.local")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("ramesh@test.local")).thenReturn(Optional.of(existingUser));
        when(donorProfileRepository.save(any(DonorProfile.class))).thenAnswer(inv -> {
            DonorProfile dp = inv.getArgument(0);
            dp.setId(200L);
            return dp;
        });

        DonorProfileUpdateRequest updateReq = new DonorProfileUpdateRequest();
        updateReq.setBloodGroup(BloodGroup.O_POSITIVE);
        updateReq.setCity("Hyderabad");
        updateReq.setLatitude(17.3850);
        updateReq.setLongitude(78.4867);

        DonorProfileDto dto = donorService.updateProfile("ramesh@test.local", updateReq);
        assertNotNull(dto);
        assertEquals(75L, dto.getUserId(), "Donor profile must reference the exact existing user account ID");
        verify(userRepository, never()).save(any()); // No second user created!
    }

    // Requirement 7: Public registration cannot create an admin account
    @Test
    @DisplayName("Req 7: Public registration with ADMIN role is strictly rejected")
    void testPublicRegistrationCannotCreateAdmin() {
        RegisterRequest hackerReq = RegisterRequest.builder()
                .name("Malicious")
                .email("hacker@test.local")
                .password("Pass123!")
                .role(Role.ADMIN)
                .build();

        assertThrows(BadRequestException.class, () -> authService.register(hackerReq));
    }

    // Requirement 9: Admin approval and rejection are authorized and audited
    @Test
    @DisplayName("Req 9: Admin approval and rejection record decision timestamp, admin ID, and audit log")
    void testAdminApprovalAndRejectionAudit() {
        User admin = User.builder().id(999L).email("admin@bloodlink.local").role(Role.ADMIN).build();
        User pending = User.builder().id(300L).email("applicant@test.local").approvalStatus(ApprovalStatus.PENDING_APPROVAL).build();

        when(userRepository.findById(300L)).thenReturn(Optional.of(pending));
        when(userRepository.findByEmail("admin@bloodlink.local")).thenReturn(Optional.of(admin));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // Test Approval
        UserDto approvedDto = adminService.approveUser(300L, "admin@bloodlink.local");
        assertEquals(ApprovalStatus.APPROVED, approvedDto.getApprovalStatus());
        assertNotNull(approvedDto.getApprovedAt());
        verify(adminAuditLogRepository, atLeastOnce()).save(any());

        // Test Rejection
        pending.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        UserDto rejectedDto = adminService.rejectUser(300L, "Unverified phone number", "admin@bloodlink.local");
        assertEquals(ApprovalStatus.REJECTED, rejectedDto.getApprovalStatus());
        assertEquals("Unverified phone number", rejectedDto.getRejectionReason());
        verify(adminAuditLogRepository, atLeast(2)).save(any());
    }

    // Requirement 8: Donor dashboard handles unconfigured profile safely
    @Test
    @DisplayName("Req 8: Donor dashboard returns safe empty state when profile is not yet completed")
    void testDonorDashboardHandlesUnconfiguredProfile() {
        when(donorProfileRepository.findByUserEmail("newuser@bloodlink.local")).thenReturn(Optional.empty());

        DonorDashboardDto dto = dashboardService.getDonorDashboard("newuser@bloodlink.local");
        assertNotNull(dto);
        assertNull(dto.getProfile(), "Profile should be null when not configured yet");
        assertEquals(0, dto.getTotalAlertsReceived());
        assertEquals(0, dto.getPendingMatches());
    }
}
