package com.bloodlink.bloodlinkbackend.service;

import com.bloodlink.bloodlinkbackend.dto.DonorDashboardDto;
import com.bloodlink.bloodlinkbackend.dto.DonorProfileDto;
import com.bloodlink.bloodlinkbackend.dto.MatchDto;
import com.bloodlink.bloodlinkbackend.dto.RequesterDashboardDto;
import com.bloodlink.bloodlinkbackend.dto.AdminDashboardDto;
import com.bloodlink.bloodlinkbackend.entity.BloodRequest;
import com.bloodlink.bloodlinkbackend.entity.DonorProfile;
import com.bloodlink.bloodlinkbackend.entity.Match;
import com.bloodlink.bloodlinkbackend.entity.User;
import com.bloodlink.bloodlinkbackend.enums.MatchStatus;
import com.bloodlink.bloodlinkbackend.enums.RequestStatus;
import com.bloodlink.bloodlinkbackend.enums.Role;
import com.bloodlink.bloodlinkbackend.exception.ResourceNotFoundException;
import com.bloodlink.bloodlinkbackend.mapper.EntityMapper;
import com.bloodlink.bloodlinkbackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final DonorProfileRepository donorProfileRepository;
    private final BloodRequestRepository bloodRequestRepository;
    private final MatchRepository matchRepository;
    private final AdminAuditLogRepository adminAuditLogRepository;

    @Transactional(readOnly = true)
    public RequesterDashboardDto getRequesterDashboard(String email) {
        User requester = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Requester not found: " + email));

        List<BloodRequest> myRequests = bloodRequestRepository.findByRequesterIdOrderByCreatedAtDesc(requester.getId());

        long totalRequests = myRequests.size();
        long activeRequests = myRequests.stream()
                .filter(r -> (r.getStatus() == RequestStatus.OPEN || r.getStatus() == RequestStatus.MATCHING || r.getStatus() == RequestStatus.RESPONDED)
                        && r.getExpiresAt().isAfter(LocalDateTime.now()))
                .count();
        long fulfilledRequests = myRequests.stream()
                .filter(r -> r.getStatus() == RequestStatus.FULFILLED)
                .count();

        long totalMatchesNotified = myRequests.stream()
                .mapToLong(r -> r.getMatches() != null ? r.getMatches().size() : 0)
                .sum();

        long totalAcceptedMatches = myRequests.stream()
                .mapToLong(r -> r.getMatches() != null
                        ? r.getMatches().stream().filter(m -> m.getResponseStatus() == MatchStatus.ACCEPTED).count()
                        : 0)
                .sum();

        var recentRequests = myRequests.stream()
                .limit(5)
                .map(EntityMapper::toBloodRequestDto)
                .collect(Collectors.toList());

        return RequesterDashboardDto.builder()
                .totalRequests(totalRequests)
                .activeRequests(activeRequests)
                .fulfilledRequests(fulfilledRequests)
                .totalMatchesNotified(totalMatchesNotified)
                .totalAcceptedMatches(totalAcceptedMatches)
                .recentRequests(recentRequests)
                .build();
    }

    @Transactional(readOnly = true)
    public DonorDashboardDto getDonorDashboard(String email) {
        DonorProfile profile = donorProfileRepository.findByUserEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Donor profile not found for: " + email));

        List<Match> matches = matchRepository.findByDonorIdOrderByCreatedAtDesc(profile.getId());

        long totalAlerts = matches.size();
        long totalAccepted = matches.stream().filter(m -> m.getResponseStatus() == MatchStatus.ACCEPTED).count();
        long totalDeclined = matches.stream().filter(m -> m.getResponseStatus() == MatchStatus.DECLINED).count();
        long pending = matches.stream().filter(m -> m.getResponseStatus() == MatchStatus.NOTIFIED).count();

        List<MatchDto> recentMatches = matches.stream()
                .limit(5)
                .map(EntityMapper::toMatchDto)
                .collect(Collectors.toList());

        DonorProfileDto profileDto = EntityMapper.toDonorProfileDto(profile);

        return DonorDashboardDto.builder()
                .profile(profileDto)
                .totalAlertsReceived(totalAlerts)
                .totalAccepted(totalAccepted)
                .totalDeclined(totalDeclined)
                .pendingMatches(pending)
                .recentMatches(recentMatches)
                .build();
    }

    @Transactional(readOnly = true)
    public AdminDashboardDto getAdminDashboard() {
        long totalUsers = userRepository.count();
        long totalDonors = userRepository.countByRole(Role.DONOR);
        long totalRequesters = userRepository.countByRole(Role.REQUESTER);
        long totalRequests = bloodRequestRepository.count();
        long activeRequests = bloodRequestRepository.findActiveRequests(LocalDateTime.now()).size();
        long fulfilledRequests = bloodRequestRepository.countByStatus(RequestStatus.FULFILLED);
        long expiredRequests = bloodRequestRepository.countByStatus(RequestStatus.EXPIRED);
        long totalMatches = matchRepository.count();

        var recentAuditLogs = adminAuditLogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .limit(10)
                .collect(Collectors.toList());

        return AdminDashboardDto.builder()
                .totalUsers(totalUsers)
                .totalDonors(totalDonors)
                .totalRequesters(totalRequesters)
                .totalRequests(totalRequests)
                .activeRequests(activeRequests)
                .fulfilledRequests(fulfilledRequests)
                .expiredRequests(expiredRequests)
                .totalMatches(totalMatches)
                .recentAuditLogs(recentAuditLogs)
                .build();
    }
}
