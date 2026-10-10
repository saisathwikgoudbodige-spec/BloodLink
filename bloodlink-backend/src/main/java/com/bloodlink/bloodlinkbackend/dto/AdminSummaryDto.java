package com.bloodlink.bloodlinkbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSummaryDto {
    private long totalUsers;
    private long pendingRegistrations;
    private long approvedUsers;
    private long rejectedUsers;
    private long activeDonors;
    private long activeRequests;
    private long totalRequests;
    private long potentialDuplicatesCount;
    private long unreadAdminNotifications;
}
