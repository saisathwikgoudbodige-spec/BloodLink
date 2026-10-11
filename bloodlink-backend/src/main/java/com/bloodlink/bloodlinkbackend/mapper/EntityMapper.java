package com.bloodlink.bloodlinkbackend.mapper;

import com.bloodlink.bloodlinkbackend.dto.*;
import com.bloodlink.bloodlinkbackend.entity.*;
import com.bloodlink.bloodlinkbackend.enums.MatchStatus;

public class EntityMapper {

    public static UserDto toUserDto(User user) {
        if (user == null) return null;

        DonorProfileDto donorProfileDto = null;
        if (user.getDonorProfile() != null) {
            try {
                donorProfileDto = toDonorProfileDto(user.getDonorProfile());
            } catch (Exception ex) {
                // Safe fallback if proxy cannot be initialized (e.g. detached state or closed session)
                donorProfileDto = null;
            }
        }

        String approvedByEmail = null;
        if (user.getApprovedBy() != null) {
            try {
                approvedByEmail = user.getApprovedBy().getEmail();
            } catch (Exception ex) {
                // Safe fallback if proxy cannot be initialized (e.g. detached state or closed session)
                approvedByEmail = null;
            }
        }

        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .active(user.isActive())
                .approvalStatus(user.getApprovalStatus())
                .rejectionReason(user.getRejectionReason())
                .approvedAt(user.getApprovedAt())
                .approvedByEmail(approvedByEmail)
                .createdAt(user.getCreatedAt())
                .donorProfile(donorProfileDto)
                .build();
    }

    public static DonorProfileDto toDonorProfileDto(DonorProfile profile) {
        if (profile == null) return null;

        Long userId = null;
        String name = null;
        String email = null;
        String phone = null;

        if (profile.getUser() != null) {
            try {
                userId = profile.getUser().getId();
                name = profile.getUser().getName();
                email = profile.getUser().getEmail();
                phone = profile.getUser().getPhone();
            } catch (Exception ex) {
                try {
                    userId = profile.getUser().getId();
                } catch (Exception ignored) {
                }
            }
        }

        return DonorProfileDto.builder()
                .id(profile.getId())
                .userId(userId)
                .name(name)
                .email(email)
                .phone(phone)
                .bloodGroup(profile.getBloodGroup())
                .bloodGroupLabel(profile.getBloodGroup() != null ? profile.getBloodGroup().getLabel() : null)
                .city(profile.getCity())
                .latitude(profile.getLatitude())
                .longitude(profile.getLongitude())
                .availabilityStatus(profile.getAvailabilityStatus())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    public static BloodRequestDto toBloodRequestDto(BloodRequest request) {
        if (request == null) return null;

        int totalMatches = 0;
        int acceptedMatches = 0;
        if (request.getMatches() != null) {
            totalMatches = request.getMatches().size();
            acceptedMatches = (int) request.getMatches().stream()
                    .filter(m -> m.getResponseStatus() == MatchStatus.ACCEPTED)
                    .count();
        }

        return BloodRequestDto.builder()
                .id(request.getId())
                .requesterId(request.getRequester() != null ? request.getRequester().getId() : null)
                .requesterName(request.getRequester() != null ? request.getRequester().getName() : null)
                .requesterPhone(request.getRequester() != null ? request.getRequester().getPhone() : null)
                .requesterEmail(request.getRequester() != null ? request.getRequester().getEmail() : null)
                .bloodGroup(request.getBloodGroup())
                .bloodGroupLabel(request.getBloodGroup() != null ? request.getBloodGroup().getLabel() : null)
                .unitsRequired(request.getUnitsRequired())
                .hospitalName(request.getHospitalName())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .urgency(request.getUrgency())
                .expiresAt(request.getExpiresAt())
                .status(request.getStatus())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .totalMatches(totalMatches)
                .acceptedMatches(acceptedMatches)
                .build();
    }

    public static MatchDto toMatchDto(Match match) {
        if (match == null) return null;

        BloodRequest req = match.getRequest();
        DonorProfile donor = match.getDonor();
        User donorUser = donor != null ? donor.getUser() : null;
        User requester = req != null ? req.getRequester() : null;

        return MatchDto.builder()
                .id(match.getId())
                .requestId(req != null ? req.getId() : null)
                .requestBloodGroup(req != null ? req.getBloodGroup() : null)
                .requestBloodGroupLabel(req != null && req.getBloodGroup() != null ? req.getBloodGroup().getLabel() : null)
                .hospitalName(req != null ? req.getHospitalName() : null)
                .requestCity(req != null ? req.getCity() : null)
                .urgency(req != null ? req.getUrgency() : null)
                .expiresAt(req != null ? req.getExpiresAt() : null)
                .requesterName(requester != null ? requester.getName() : null)
                .requesterPhone(requester != null ? requester.getPhone() : null)
                .donorId(donor != null ? donor.getId() : null)
                .donorUserId(donorUser != null ? donorUser.getId() : null)
                .donorName(donorUser != null ? donorUser.getName() : null)
                .donorPhone(donorUser != null ? donorUser.getPhone() : null)
                .donorBloodGroup(donor != null ? donor.getBloodGroup() : null)
                .donorBloodGroupLabel(donor != null && donor.getBloodGroup() != null ? donor.getBloodGroup().getLabel() : null)
                .donorCity(donor != null ? donor.getCity() : null)
                .distanceKm(match.getDistanceKm())
                .responseStatus(match.getResponseStatus())
                .notifiedAt(match.getNotifiedAt())
                .respondedAt(match.getRespondedAt())
                .createdAt(match.getCreatedAt())
                .build();
    }

    public static NotificationDto toNotificationDto(Notification notification) {
        if (notification == null) return null;

        return NotificationDto.builder()
                .id(notification.getId())
                .userId(notification.getUser() != null ? notification.getUser().getId() : null)
                .requestId(notification.getRequestId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
