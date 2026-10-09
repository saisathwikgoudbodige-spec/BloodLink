package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.BloodRequestDto;
import com.bloodlink.bloodlinkbackend.entity.BloodRequest;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import com.bloodlink.bloodlinkbackend.enums.RequestStatus;
import com.bloodlink.bloodlinkbackend.enums.Urgency;
import com.bloodlink.bloodlinkbackend.repository.BloodRequestRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DuplicateDetectionService Unit Tests")
class DuplicateDetectionServiceTest {

    @Mock
    private BloodRequestRepository bloodRequestRepository;

    @InjectMocks
    private DuplicateDetectionService duplicateDetectionService;

    @Test
    @DisplayName("Should detect duplicate when same requester submits same blood group in time window")
    void testDetectDuplicateSameRequester() {
        User user1 = User.builder().id(1L).email("user1@test.com").name("User One").build();
        LocalDateTime now = LocalDateTime.now();

        BloodRequest target = BloodRequest.builder()
                .id(100L)
                .requester(user1)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .hospitalName("Hospital Alpha")
                .city("Hyderabad")
                .createdAt(now)
                .build();

        BloodRequest prior = BloodRequest.builder()
                .id(99L)
                .requester(user1)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .hospitalName("Hospital Beta")
                .city("Hyderabad")
                .createdAt(now.minusHours(3))
                .status(RequestStatus.OPEN)
                .build();

        when(bloodRequestRepository.findAll()).thenReturn(List.of(target, prior));

        List<BloodRequestDto> duplicates = duplicateDetectionService.detectPotentialDuplicates(target);
        assertEquals(1, duplicates.size());
        assertEquals(99L, duplicates.get(0).getId());
    }

    @Test
    @DisplayName("Different blood group should not be flagged as duplicate")
    void testDifferentBloodGroupNotDuplicate() {
        User user1 = User.builder().id(1L).email("user1@test.com").name("User One").build();
        User user2 = User.builder().id(2L).email("user2@test.com").name("User Two").build();
        LocalDateTime now = LocalDateTime.now();

        BloodRequest target = BloodRequest.builder()
                .id(100L)
                .requester(user1)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .hospitalName("Hospital Alpha")
                .city("Hyderabad")
                .createdAt(now)
                .build();

        BloodRequest other = BloodRequest.builder()
                .id(101L)
                .requester(user2)
                .bloodGroup(BloodGroup.AB_NEGATIVE)
                .hospitalName("Hospital Gamma")
                .city("Delhi")
                .createdAt(now.minusHours(2))
                .status(RequestStatus.OPEN)
                .build();

        when(bloodRequestRepository.findAll()).thenReturn(List.of(target, other));

        List<BloodRequestDto> duplicates = duplicateDetectionService.detectPotentialDuplicates(target);
        assertTrue(duplicates.isEmpty());
    }
}
