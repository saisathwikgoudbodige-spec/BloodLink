package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.AuthResponse;
import com.bloodlink.bloodlinkbackend.dto.LoginRequest;
import com.bloodlink.bloodlinkbackend.dto.RegisterRequest;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import com.bloodlink.bloodlinkbackend.enums.Role;
import com.bloodlink.bloodlinkbackend.exception.BadRequestException;
import com.bloodlink.bloodlinkbackend.exception.ResourceNotFoundException;
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

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Should successfully register a requester and return JWT token")
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

        UserDetails mockUserDetails = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername(anyString())).thenReturn(mockUserDetails);
        when(jwtService.generateToken(mockUserDetails)).thenReturn("mock.jwt.token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getToken());
        assertEquals("Bearer", response.getType());
        assertEquals("newreq@test.local", response.getUser().getEmail());
        verify(donorProfileRepository, never()).save(any());
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
        User inactiveUser = User.builder().id(1L).email("inactive@test.local").active(false).build();

        when(userRepository.findByEmail("inactive@test.local")).thenReturn(Optional.of(inactiveUser));

        assertThrows(BadRequestException.class, () -> authService.login(loginRequest));
    }
}
