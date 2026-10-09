package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.entity.BloodRequest;
import com.bloodlink.bloodlinkbackend.entity.DonorProfile;
import com.bloodlink.bloodlinkbackend.entity.Match;
import com.bloodlink.bloodlinkbackend.enums.AvailabilityStatus;
import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import com.bloodlink.bloodlinkbackend.enums.MatchStatus;
import com.bloodlink.bloodlinkbackend.enums.NotificationType;
import com.bloodlink.bloodlinkbackend.enums.RequestStatus;
import com.bloodlink.bloodlinkbackend.repository.BloodRequestRepository;
import com.bloodlink.bloodlinkbackend.repository.DonorProfileRepository;
import com.bloodlink.bloodlinkbackend.repository.MatchRepository;
import com.bloodlink.bloodlinkbackend.util.LocationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingEngineService {

    private final DonorProfileRepository donorProfileRepository;
    private final MatchRepository matchRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final NotificationService notificationService;

    /**
     * Executes the matching algorithm for an emergency blood request.
     * Identifies compatible available donors, computes distances, records match entries,
     * and dispatches real-time alerts.
     */
    @Transactional
    public List<Match> matchDonorsForRequest(BloodRequest request) {
        if (request == null || request.getStatus() == RequestStatus.CLOSED || request.getStatus() == RequestStatus.EXPIRED) {
            return Collections.emptyList();
        }

        // 1. Determine compatible donor blood groups
        Set<BloodGroup> compatibleGroups = request.getBloodGroup().getCompatibleDonorGroups();

        // 2. Query available active donors matching these blood groups
        List<DonorProfile> candidateDonors = donorProfileRepository.findCompatibleAvailableDonors(
                compatibleGroups,
                AvailabilityStatus.AVAILABLE
        );

        List<Match> createdMatches = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (DonorProfile donor : candidateDonors) {
            // Prevent requester from matching against their own donor profile
            if (donor.getUser() != null && request.getRequester() != null &&
                    donor.getUser().getId().equals(request.getRequester().getId())) {
                continue;
            }

            // Check if match already exists
            if (matchRepository.existsByRequestIdAndDonorId(request.getId(), donor.getId())) {
                continue;
            }

            // Calculate approximate distance
            Double distanceKm = LocationUtil.calculateDistanceKm(
                    request.getLatitude(),
                    request.getLongitude(),
                    donor.getLatitude(),
                    donor.getLongitude()
            );

            Match match = Match.builder()
                    .request(request)
                    .donor(donor)
                    .distanceKm(distanceKm)
                    .responseStatus(MatchStatus.NOTIFIED)
                    .notifiedAt(now)
                    .createdAt(now)
                    .build();

            Match savedMatch = matchRepository.save(match);
            createdMatches.add(savedMatch);

            // Notify potential donor
            String title = "Potential Match: " + request.getBloodGroup().getLabel() + " Request";
            String distanceStr = distanceKm != null ? " (~" + distanceKm + " km away)" : "";
            String message = String.format(
                    "A patient at %s in %s requires %d unit(s) of %s blood%s. Urgency: %s. Please review and respond if available.",
                    request.getHospitalName(),
                    request.getCity(),
                    request.getUnitsRequired(),
                    request.getBloodGroup().getLabel(),
                    distanceStr,
                    request.getUrgency().name()
            );

            notificationService.createAndSendNotification(
                    donor.getUser(),
                    request.getId(),
                    title,
                    message,
                    NotificationType.NEW_MATCH
            );
        }

        // Update request status to MATCHING if matches found and currently OPEN
        if (!createdMatches.isEmpty() && request.getStatus() == RequestStatus.OPEN) {
            request.setStatus(RequestStatus.MATCHING);
            bloodRequestRepository.save(request);
        }

        log.info("Matching engine executed for Request ID {}: found {} potential donor matches",
                request.getId(), createdMatches.size());

        return createdMatches;
    }
}
