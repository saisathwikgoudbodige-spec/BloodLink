package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.entity.BloodRequest;
import com.bloodlink.bloodlinkbackend.entity.DonorProfile;
import com.bloodlink.bloodlinkbackend.entity.Match;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.*;
import com.bloodlink.bloodlinkbackend.repository.BloodRequestRepository;
import com.bloodlink.bloodlinkbackend.repository.DonorProfileRepository;
import com.bloodlink.bloodlinkbackend.repository.MatchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MatchingService Unit Tests")
class MatchingServiceTest {

    @Spy
    private BloodCompatibilityService compatibilityService = new BloodCompatibilityService();

    @Mock
    private DonorProfileRepository donorProfileRepository;

    @Mock
    private MatchRepository matchRepository;

    @Mock
    private BloodRequestRepository bloodRequestRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private MatchingService matchingService;

    private User requesterUser;
    private User donorUser1;
    private User donorUser2;
    private DonorProfile donorProfile1;
    private DonorProfile donorProfile2;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(matchingService, "matchingRadiusKm", 50.0);

        requesterUser = User.builder().id(1L).email("requester@test.local").name("Requester").active(true).build();
        donorUser1 = User.builder().id(2L).email("donor1@test.local").name("Donor One").active(true).build();
        donorUser2 = User.builder().id(3L).email("donor2@test.local").name("Donor Two").active(true).build();

        donorProfile1 = DonorProfile.builder()
                .id(101L)
                .user(donorUser1)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .city("Hyderabad")
                .latitude(17.3850)
                .longitude(78.4867)
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .build();

        donorProfile2 = DonorProfile.builder()
                .id(102L)
                .user(donorUser2)
                .bloodGroup(BloodGroup.O_NEGATIVE)
                .city("Hyderabad")
                .latitude(17.4399)
                .longitude(78.4983)
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .build();
    }

    @Test
    @DisplayName("Should find and rank compatible donors for active O+ request")
    void testMatchDonorsSuccess() {
        BloodRequest request = BloodRequest.builder()
                .id(10L)
                .requester(requesterUser)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .unitsRequired(2)
                .hospitalName("Demo Hospital")
                .city("Hyderabad")
                .latitude(17.3910)
                .longitude(78.4720)
                .urgency(Urgency.CRITICAL)
                .expiresAt(LocalDateTime.now().plusHours(4))
                .status(RequestStatus.OPEN)
                .build();

        when(donorProfileRepository.findCompatibleAvailableDonors(anySet(), eq(AvailabilityStatus.AVAILABLE)))
                .thenReturn(List.of(donorProfile1, donorProfile2));

        when(matchRepository.existsByRequestIdAndDonorId(anyLong(), anyLong())).thenReturn(false);
        when(matchRepository.save(any(Match.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Match> matches = matchingService.matchDonorsForRequest(request);

        assertNotNull(matches);
        assertEquals(2, matches.size());
        verify(notificationService, times(2)).createAndSendNotification(any(), eq(10L), anyString(), anyString(), eq(NotificationType.NEW_MATCH));
        verify(bloodRequestRepository, times(1)).save(request);
        assertEquals(RequestStatus.MATCHING, request.getStatus());
    }

    @Test
    @DisplayName("Expired request should not create matches")
    void testExpiredRequestMatching() {
        BloodRequest request = BloodRequest.builder()
                .id(11L)
                .requester(requesterUser)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .expiresAt(LocalDateTime.now().minusHours(1))
                .status(RequestStatus.OPEN)
                .build();

        List<Match> matches = matchingService.matchDonorsForRequest(request);
        assertTrue(matches.isEmpty());
        verify(matchRepository, never()).save(any());
    }

    @Test
    @DisplayName("Requester should not be matched to their own blood request")
    void testSelfMatchingExcluded() {
        DonorProfile selfDonor = DonorProfile.builder()
                .id(103L)
                .user(requesterUser) // same user as requester
                .bloodGroup(BloodGroup.O_POSITIVE)
                .availabilityStatus(AvailabilityStatus.AVAILABLE)
                .build();

        BloodRequest request = BloodRequest.builder()
                .id(12L)
                .requester(requesterUser)
                .bloodGroup(BloodGroup.O_POSITIVE)
                .expiresAt(LocalDateTime.now().plusHours(2))
                .status(RequestStatus.OPEN)
                .build();

        when(donorProfileRepository.findCompatibleAvailableDonors(anySet(), eq(AvailabilityStatus.AVAILABLE)))
                .thenReturn(List.of(selfDonor));

        List<Match> matches = matchingService.matchDonorsForRequest(request);
        assertTrue(matches.isEmpty());
    }
}
