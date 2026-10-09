package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.DonorAvailabilityRequest;
import com.bloodlink.bloodlinkbackend.dto.DonorProfileDto;
import com.bloodlink.bloodlinkbackend.dto.DonorProfileUpdateRequest;
import com.bloodlink.bloodlinkbackend.dto.MatchDto;
import com.bloodlink.bloodlinkbackend.entity.DonorProfile;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.AvailabilityStatus;
import com.bloodlink.bloodlinkbackend.exception.ResourceNotFoundException;
import com.bloodlink.bloodlinkbackend.mapper.EntityMapper;
import com.bloodlink.bloodlinkbackend.repository.DonorProfileRepository;
import com.bloodlink.bloodlinkbackend.repository.MatchRepository;
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
public class DonorService {

    private final DonorProfileRepository donorProfileRepository;
    private final UserRepository userRepository;
    private final MatchRepository matchRepository;

    @Transactional(readOnly = true)
    public DonorProfileDto getProfileByEmail(String email) {
        DonorProfile profile = donorProfileRepository.findByUserEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Donor profile not found for user: " + email));
        return EntityMapper.toDonorProfileDto(profile);
    }

    @Transactional
    public DonorProfileDto updateProfile(String email, DonorProfileUpdateRequest request) {
        DonorProfile profile = donorProfileRepository.findByUserEmail(email.toLowerCase())
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(email.toLowerCase())
                            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
                    return DonorProfile.builder()
                            .user(user)
                            .availabilityStatus(AvailabilityStatus.AVAILABLE)
                            .build();
                });

        profile.setBloodGroup(request.getBloodGroup());
        profile.setCity(request.getCity().trim());
        profile.setLatitude(request.getLatitude());
        profile.setLongitude(request.getLongitude());
        profile.setUpdatedAt(LocalDateTime.now());

        DonorProfile saved = donorProfileRepository.save(profile);
        return EntityMapper.toDonorProfileDto(saved);
    }

    @Transactional
    public DonorProfileDto updateAvailability(String email, DonorAvailabilityRequest request) {
        DonorProfile profile = donorProfileRepository.findByUserEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Donor profile not found for user: " + email));

        profile.setAvailabilityStatus(request.getAvailabilityStatus());
        profile.setUpdatedAt(LocalDateTime.now());

        DonorProfile saved = donorProfileRepository.save(profile);
        log.info("Donor {} availability updated to: {}", email, request.getAvailabilityStatus());
        return EntityMapper.toDonorProfileDto(saved);
    }

    @Transactional(readOnly = true)
    public List<MatchDto> getDonorMatches(String email) {
        DonorProfile profile = donorProfileRepository.findByUserEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Donor profile not found for user: " + email));

        return matchRepository.findByDonorIdOrderByCreatedAtDesc(profile.getId())
                .stream()
                .map(EntityMapper::toMatchDto)
                .collect(Collectors.toList());
    }
}
