package com.bloodlink.bloodlinkbackend.dto;

import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import com.bloodlink.bloodlinkbackend.enums.MatchStatus;
import com.bloodlink.bloodlinkbackend.enums.Urgency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchDto {

    private Long id;
    private Long requestId;
    private BloodGroup requestBloodGroup;
    private String requestBloodGroupLabel;
    private String hospitalName;
    private String requestCity;
    private Urgency urgency;
    private LocalDateTime expiresAt;
    private String requesterName;
    private String requesterPhone;

    private Long donorId;
    private Long donorUserId;
    private String donorName;
    private String donorPhone;
    private BloodGroup donorBloodGroup;
    private String donorBloodGroupLabel;
    private String donorCity;

    private Double distanceKm;
    private MatchStatus responseStatus;
    private LocalDateTime notifiedAt;
    private LocalDateTime respondedAt;
    private LocalDateTime createdAt;

    @Builder.Default
    private String compatibilityNote = "Compatible according to configured application rules. Potential match awaiting medical verification.";
}
