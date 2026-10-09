package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.AuthResponse;
import com.bloodlink.bloodlinkbackend.dto.LoginRequest;
import com.bloodlink.bloodlinkbackend.dto.RegisterRequest;
import com.bloodlink.bloodlinkbackend.dto.UserDto;
import com.bloodlink.bloodlinkbackend.entity.DonorProfile;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.AvailabilityStatus;
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

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email already exists: " + request.getEmail());
        }

        if (request.getRole() == Role.DONOR && request.getBloodGroup() == null) {
            throw new BadRequestException("Blood group is required for Donor registration");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .role(request.getRole())
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        if (request.getRole() == Role.DONOR) {
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

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(EntityMapper.toUserDto(savedUser))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword())
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (!user.isActive()) {
            throw new BadRequestException("This account has been deactivated. Please contact an administrator.");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtService.generateToken(userDetails);

        return AuthResponse.builder()
                .token(token)
                .type("Bearer")
                .user(EntityMapper.toUserDto(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        return EntityMapper.toUserDto(user);
    }
}
