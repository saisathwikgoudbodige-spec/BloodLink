package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.AuthResponse;
import com.bloodlink.bloodlinkbackend.dto.LoginRequest;
import com.bloodlink.bloodlinkbackend.dto.RegisterRequest;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.ApprovalStatus;
import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import com.bloodlink.bloodlinkbackend.enums.Role;
import com.bloodlink.bloodlinkbackend.exception.BadRequestException;
import com.bloodlink.bloodlinkbackend.repository.DonorProfileRepository;
import com.bloodlink.bloodlinkbackend.repository.UserRepository;
import com.bloodlink.bloodlinkbackend.security.CustomUserDetailsService;
import com.bloodlink.bloodlinkbackend.security.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DonorProfileRepository donorProfileRepository;

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

    @Test
    @DisplayName("Should successfully register a requester in PENDING_APPROVAL status without issuing a JWT")
    void testRegisterRequesterSuccess() {
        RegisterRequest request = RegisterRequest.builder()
                .name("New Requester")
                .email("newreq@test.local")
                .password("Password123!")
                .phone("+91-9876543210")
                .role(Role.REQUESTER)
                .build();

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertNull(response.getToken(), "Pending user must not receive an active JWT token");
        assertEquals(ApprovalStatus.PENDING_APPROVAL, response.getUser().getApprovalStatus());
        assertTrue(response.getMessage().contains("awaiting administrator approval"));
        verify(notificationService).notifyAdmins(isNull(), anyString(), anyString(), any());
    }

    @Test
    @DisplayName("Public user cannot self-assign the ADMIN role on registration")
    void testRegisterAdminRoleRejected() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Hacker Admin")
                .email("hacker@test.local")
                .password("Password123!")
                .role(Role.ADMIN)
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("ADMIN"));
    }

    @Test
    @DisplayName("Pending approval user cannot log in")
    void testLoginPendingUserRejected() {
        LoginRequest loginRequest = new LoginRequest("pending@test.local", "Password123!");
        User pendingUser = User.builder()
                .id(1L)
                .email("pending@test.local")
                .active(true)
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
                .build();

        when(userRepository.findByEmail("pending@test.local")).thenReturn(Optional.of(pendingUser));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.login(loginRequest));
        assertTrue(ex.getMessage().contains("pending administrator approval"));
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    @DisplayName("Rejected user cannot log in")
    void testLoginRejectedUserDenied() {
        LoginRequest loginRequest = new LoginRequest("rejected@test.local", "Password123!");
        User rejectedUser = User.builder()
                .id(2L)
                .email("rejected@test.local")
                .active(true)
                .approvalStatus(ApprovalStatus.REJECTED)
                .rejectionReason("Invalid medical document")
                .build();

        when(userRepository.findByEmail("rejected@test.local")).thenReturn(Optional.of(rejectedUser));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.login(loginRequest));
        assertTrue(ex.getMessage().contains("rejected"));
        assertTrue(ex.getMessage().contains("Invalid medical document"));
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    @DisplayName("Approved active user logs in successfully and receives JWT")
    void testLoginApprovedUserSuccess() {
        LoginRequest loginRequest = new LoginRequest("approved@test.local", "Password123!");
        User approvedUser = User.builder()
                .id(3L)
                .email("approved@test.local")
                .active(true)
                .role(Role.REQUESTER)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();

        when(userRepository.findByEmail("approved@test.local")).thenReturn(Optional.of(approvedUser));
        UserDetails mockUserDetails = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("approved@test.local")).thenReturn(mockUserDetails);
        when(jwtService.generateToken(mockUserDetails)).thenReturn("valid.jwt.token");

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("valid.jwt.token", response.getToken());
        assertEquals(ApprovalStatus.APPROVED, response.getUser().getApprovalStatus());
        verify(authenticationManager).authenticate(any());
    }

    @Test
    @DisplayName("Registering donor without blood group throws BadRequestException")
    void testRegisterDonorWithoutBloodGroup() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Donor No Group")
                .email("donor@test.local")
                .password("Password123!")
                .role(Role.DONOR)
                .bloodGroup(null)
                .build();

        when(userRepository.existsByEmail(anyString())).thenReturn(false);

        assertThrows(BadRequestException.class, () -> authService.register(request));
    }

    @Test
    @DisplayName("Registering duplicate email throws BadRequestException")
    void testRegisterDuplicateEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Duplicate User")
                .email("existing@test.local")
                .password("Password123!")
                .role(Role.REQUESTER)
                .build();

        when(userRepository.existsByEmail("existing@test.local")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(request));
    }

    @Test
    @DisplayName("Login with inactive user throws BadRequestException")
    void testLoginInactiveUser() {
        LoginRequest loginRequest = new LoginRequest("inactive@test.local", "Password123!");
        User inactiveUser = User.builder()
                .id(1L)
                .email("inactive@test.local")
                .active(false)
                .approvalStatus(ApprovalStatus.APPROVED)
                .build();

        when(userRepository.findByEmail("inactive@test.local")).thenReturn(Optional.of(inactiveUser));

        assertThrows(BadRequestException.class, () -> authService.login(loginRequest));
    }
}
