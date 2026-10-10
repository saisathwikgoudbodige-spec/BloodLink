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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Transparent, rule-based matching engine for emergency blood requests.
 * Evaluates donor compatibility, availability, and geographic proximity.
 * <p>
 * NOTE: This is an application-level matching and ranking system, NOT a medical decision or prediction system.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingService {

    private final BloodCompatibilityService compatibilityService;
    private final DonorProfileRepository donorProfileRepository;
    private final MatchRepository matchRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final NotificationService notificationService;

    @Value("${app.matching.radius-km:50.0}")
    private double matchingRadiusKm;

    @Transactional
    public List<Match> matchDonorsForRequest(BloodRequest request) {
        if (request == null) {
            return Collections.emptyList();
        }

        // Only requests in OPEN or MATCHING state participate
        if (request.getStatus() != RequestStatus.OPEN && request.getStatus() != RequestStatus.MATCHING) {
            log.info("Request ID {} is not in active matching status ({}), skipping matching", request.getId(), request.getStatus());
            return Collections.emptyList();
        }

        if (request.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.info("Request ID {} has expired, skipping matching", request.getId());
            return Collections.emptyList();
        }

        // 1. Get compatible donor blood groups from centralized BloodCompatibilityService
        Set<BloodGroup> compatibleGroups = compatibilityService.getCompatibleDonorGroups(request.getBloodGroup());
        if (compatibleGroups.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Query active, available donors
        List<DonorProfile> candidateDonors = donorProfileRepository.findCompatibleAvailableDonors(
                compatibleGroups,
                AvailabilityStatus.AVAILABLE
        );

        LocalDateTime now = LocalDateTime.now();
        List<MatchCandidate> rankedCandidates = new ArrayList<>();

        for (DonorProfile donor : candidateDonors) {
            // Exclude requester self-matching
            if (donor.getUser() != null && request.getRequester() != null &&
                    donor.getUser().getId().equals(request.getRequester().getId())) {
                continue;
            }

            // Exclude already matched donors for this request
            if (matchRepository.existsByRequestIdAndDonorId(request.getId(), donor.getId())) {
                continue;
            }

            // Inactive or unapproved accounts cannot participate
            if (donor.getUser() != null && (!donor.getUser().isActive() || donor.getUser().getApprovalStatus() != com.bloodlink.bloodlinkbackend.enums.ApprovalStatus.APPROVED)) {
                continue;
            }

            Double distanceKm = LocationUtil.calculateDistanceKm(
                    request.getLatitude(),
                    request.getLongitude(),
                    donor.getLatitude(),
                    donor.getLongitude()
            );

            // If coordinates exist for both and distance exceeds radius, filter out unless critical urgency
            if (distanceKm != null && distanceKm > matchingRadiusKm && request.getUrgency() != com.bloodlink.bloodlinkbackend.enums.Urgency.CRITICAL) {
                continue;
            }

            // Exact blood group match receives higher ranking priority
            boolean exactBloodMatch = donor.getBloodGroup() == request.getBloodGroup();

            rankedCandidates.add(new MatchCandidate(donor, distanceKm, exactBloodMatch));
        }

        // 3. Rank candidates by: Exact blood match first, then approximate distance (nulls last)
        rankedCandidates.sort(Comparator
                .comparing(MatchCandidate::isExactBloodMatch).reversed()
                .thenComparing(c -> c.getDistanceKm() != null ? c.getDistanceKm() : Double.MAX_VALUE));

        List<Match> createdMatches = new ArrayList<>();

        for (MatchCandidate candidate : rankedCandidates) {
            Match match = Match.builder()
                    .request(request)
                    .donor(candidate.getDonor())
                    .distanceKm(candidate.getDistanceKm())
                    .responseStatus(MatchStatus.NOTIFIED)
                    .notifiedAt(now)
                    .createdAt(now)
                    .build();

            Match savedMatch = matchRepository.save(match);
            createdMatches.add(savedMatch);

            // Notify potential donor with neutral wording
            String title = "Potential Blood Requirement Match: " + request.getBloodGroup().getLabel() + " Request";
            String distanceStr = candidate.getDistanceKm() != null ? String.format(" (~%.1f km away)", candidate.getDistanceKm()) : "";
            String message = String.format(
                    "A patient at %s in %s has an emergency requirement for %d unit(s) of %s blood%s. Urgency: %s. Please review and respond if available.",
                    request.getHospitalName(),
                    request.getCity(),
                    request.getUnitsRequired(),
                    request.getBloodGroup().getLabel(),
                    distanceStr,
                    request.getUrgency().name()
            );

            notificationService.createAndSendNotification(
                    candidate.getDonor().getUser(),
                    request.getId(),
                    title,
                    message,
                    NotificationType.NEW_MATCH
            );
        }

        // Advance request status to MATCHING if matches were created
        if (!createdMatches.isEmpty() && request.getStatus() == RequestStatus.OPEN) {
            request.setStatus(RequestStatus.MATCHING);
            bloodRequestRepository.save(request);
        }

        log.info("Matching engine matched {} potential donors for request #{}", createdMatches.size(), request.getId());
        return createdMatches;
    }

    private static class MatchCandidate {
        private final DonorProfile donor;
        private final Double distanceKm;
        private final boolean exactBloodMatch;

        public MatchCandidate(DonorProfile donor, Double distanceKm, boolean exactBloodMatch) {
            this.donor = donor;
            this.distanceKm = distanceKm;
            this.exactBloodMatch = exactBloodMatch;
        }

        public DonorProfile getDonor() {
            return donor;
        }

        public Double getDistanceKm() {
            return distanceKm;
        }

        public boolean isExactBloodMatch() {
            return exactBloodMatch;
        }
    }
}
