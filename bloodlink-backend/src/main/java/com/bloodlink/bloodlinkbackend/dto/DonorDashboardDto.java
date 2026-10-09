package com.bloodlink.bloodlinkbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonorDashboardDto {

    private DonorProfileDto profile;
    private long totalAlertsReceived;
    private long totalAccepted;
    private long totalDeclined;
    private long pendingMatches;
    private List<MatchDto> recentMatches;
}
