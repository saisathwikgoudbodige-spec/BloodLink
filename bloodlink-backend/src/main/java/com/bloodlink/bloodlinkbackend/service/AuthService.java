package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.AuthResponse;
import com.bloodlink.bloodlinkbackend.dto.LoginRequest;
import com.bloodlink.bloodlinkbackend.dto.RegisterRequest;
import com.bloodlink.bloodlinkbackend.dto.UserDto;
import com.bloodlink.bloodlinkbackend.entity.DonorProfile;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.ApprovalStatus;
import com.bloodlink.bloodlinkbackend.enums.AvailabilityStatus;
import com.bloodlink.bloodlinkbackend.enums.NotificationType;
import com.bloodlink.bloodlinkbackend.enums.Role;
import com.bloodlink.bloodlinkbackend.exception.BadRequestException;
import com.bloodlink.bloodlinkbackend.exception.ResourceNotFoundException;
import com.bloodlink.bloodlinkbackend.mapper.EntityMapper;
import com.bloodlink.bloodlinkbackend.repository.DonorProfileRepository;
import com.bloodlink.bloodlinkbackend.repository.UserRepository;
import com.bloodlink.bloodlinkbackend.security.CustomUserDetailsService;
import com.bloodlink.bloodlinkbackend.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final NotificationService notificationService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        Role assignedRole = request.getRole() != null ? request.getRole() : Role.USER;
        if (assignedRole == Role.ADMIN) {
            throw new BadRequestException("Public self-assignment of the ADMIN role is strictly prohibited.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email already exists: " + request.getEmail());
        }

        if (request.getRole() == Role.DONOR && request.getBloodGroup() == null) {
            throw new BadRequestException("Blood group is required for explicit Donor registration");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(assignedRole)
                .active(true)
                .approvalStatus(ApprovalStatus.PENDING_APPROVAL)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        // If donor details are provided during registration, initialize the donor profile
        if (request.getBloodGroup() != null) {
            DonorProfile profile = DonorProfile.builder()
                    .user(savedUser)
                    .bloodGroup(request.getBloodGroup())
                    .city(request.getCity() != null ? request.getCity().trim() : "Unknown")
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .availabilityStatus(AvailabilityStatus.AVAILABLE)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            donorProfileRepository.save(profile);
            savedUser.setDonorProfile(profile);
        }

        // Notify system administrators about new registration awaiting approval
        try {
            notificationService.notifyAdmins(
                    null,
                    "New User Registration Pending Review",
                    String.format("A new %s account has registered: %s (%s). Please review and approve/reject.",
                            savedUser.getRole(), savedUser.getName(), savedUser.getEmail()),
                    NotificationType.USER_REGISTRATION
            );
        } catch (Exception ex) {
            log.warn("Failed to dispatch admin notification for new user registration #{}: {}", savedUser.getId(), ex.getMessage());
        }

        log.info("User #{} ({}) registered successfully with status PENDING_APPROVAL", savedUser.getId(), savedUser.getEmail());

        // Do not issue a JWT token for pending accounts
        return AuthResponse.builder()
                .token(null)
                .type("Bearer")
                .user(EntityMapper.toUserDto(savedUser))
                .message("Registration submitted successfully. Your account is awaiting administrator approval before you can log in.")
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        // Check approval status before authentication to provide clear feedback
        if (user.getApprovalStatus() == ApprovalStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Your account is pending administrator approval. Please wait for an administrator to review your registration.");
        }

        if (user.getApprovalStatus() == ApprovalStatus.REJECTED) {
            String reason = user.getRejectionReason() != null ? ": " + user.getRejectionReason() : ".";
            throw new BadRequestException("Your account registration was rejected by an administrator" + reason);
        }

        if (!user.isActive()) {
            throw new BadRequestException("This account has been deactivated. Please contact an administrator.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtService.generateToken(userDetails);

        // Map safely while the persistence context is active
        UserDto userDto = EntityMapper.toUserDto(user);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(userDto)
                .message("Login successful")
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return EntityMapper.toUserDto(user);
    }
}
