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
public class RequesterDashboardDto {

    private long totalRequests;
    private long activeRequests;
    private long fulfilledRequests;
    private long totalMatchesNotified;
    private long totalAcceptedMatches;
    private List<BloodRequestDto> recentRequests;
}
