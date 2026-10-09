package com.bloodlink.bloodlinkbackend.dto;

import com.bloodlink.bloodlinkbackend.entity.AdminAuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDto {

    private long totalUsers;
    private long totalDonors;
    private long totalRequesters;
    private long totalRequests;
    private long activeRequests;
    private long fulfilledRequests;
    private long expiredRequests;
    private long totalMatches;
    private List<AdminAuditLog> recentAuditLogs;
}
