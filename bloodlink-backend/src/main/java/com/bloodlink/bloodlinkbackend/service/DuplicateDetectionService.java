package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.BloodRequestDto;
import com.bloodlink.bloodlinkbackend.entity.BloodRequest;
import com.bloodlink.bloodlinkbackend.mapper.EntityMapper;
import com.bloodlink.bloodlinkbackend.repository.BloodRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Basic duplicate-request screening service.
 * Used exclusively as an administrative and triage review aid.
 * NOTE: This is NOT a fraud detection system.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DuplicateDetectionService {

    private final BloodRequestRepository bloodRequestRepository;

    @Transactional(readOnly = true)
    public List<BloodRequestDto> detectPotentialDuplicates(BloodRequest target) {
        if (target == null || target.getId() == null) {
            return List.of();
        }

        LocalDateTime searchWindowStart = target.getCreatedAt().minusHours(48);
        LocalDateTime searchWindowEnd = target.getCreatedAt().plusHours(48);

        return bloodRequestRepository.findAll().stream()
                .filter(other -> !other.getId().equals(target.getId()))
                .filter(other -> other.getCreatedAt().isAfter(searchWindowStart) && other.getCreatedAt().isBefore(searchWindowEnd))
                .filter(other -> isPotentialDuplicate(target, other))
                .map(EntityMapper::toBloodRequestDto)
                .collect(Collectors.toList());
    }

    private boolean isPotentialDuplicate(BloodRequest req1, BloodRequest req2) {
        // Criterion 1: Same requester and same blood group within window
        if (req1.getRequester() != null && req2.getRequester() != null &&
                req1.getRequester().getId().equals(req2.getRequester().getId()) &&
                req1.getBloodGroup() == req2.getBloodGroup()) {
            return true;
        }

        // Criterion 2: Same hospital and same blood group within window
        if (req1.getHospitalName().trim().equalsIgnoreCase(req2.getHospitalName().trim()) &&
                req1.getBloodGroup() == req2.getBloodGroup()) {
            return true;
        }

        // Criterion 3: Same city and same blood group within 24 hours
        if (req1.getCity().trim().equalsIgnoreCase(req2.getCity().trim()) &&
                req1.getBloodGroup() == req2.getBloodGroup() &&
                Math.abs(java.time.Duration.between(req1.getCreatedAt(), req2.getCreatedAt()).toHours()) <= 24) {
            return true;
        }

        return false;
    }
}
