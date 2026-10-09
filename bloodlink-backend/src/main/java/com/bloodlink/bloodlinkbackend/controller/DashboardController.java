package com.bloodlink.bloodlinkbackend.controller;

import com.bloodlink.bloodlinkbackend.dto.AdminDashboardDto;
import com.bloodlink.bloodlinkbackend.dto.ApiResponse;
import com.bloodlink.bloodlinkbackend.dto.DonorDashboardDto;
import com.bloodlink.bloodlinkbackend.dto.RequesterDashboardDto;
import com.bloodlink.bloodlinkbackend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/requester")
    @PreAuthorize("hasRole('REQUESTER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RequesterDashboardDto>> getRequesterDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        RequesterDashboardDto dto = dashboardService.getRequesterDashboard(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @GetMapping("/donor")
    @PreAuthorize("hasRole('DONOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DonorDashboardDto>> getDonorDashboard(
            @AuthenticationPrincipal UserDetails userDetails) {
        DonorDashboardDto dto = dashboardService.getDonorDashboard(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminDashboardDto>> getAdminDashboard() {
        AdminDashboardDto dto = dashboardService.getAdminDashboard();
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}
