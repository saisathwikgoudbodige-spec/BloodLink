package com.bloodlink.bloodlinkbackend.controller;

import com.bloodlink.bloodlinkbackend.dto.ApiResponse;
import com.bloodlink.bloodlinkbackend.dto.BloodRequestDto;
import com.bloodlink.bloodlinkbackend.dto.UserDto;
import com.bloodlink.bloodlinkbackend.entity.AdminAuditLog;
import com.bloodlink.bloodlinkbackend.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserDto>> toggleUserStatus(
            @PathVariable Long id,
            @RequestParam boolean active,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserDto updated = adminService.toggleUserStatus(id, active, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("User status updated", updated));
    }

    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<List<BloodRequestDto>>> getAllRequests() {
        List<BloodRequestDto> list = adminService.getAllRequests();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/requests/{id}/duplicates")
    public ResponseEntity<ApiResponse<List<BloodRequestDto>>> getPotentialDuplicates(@PathVariable Long id) {
        List<BloodRequestDto> duplicates = adminService.findPotentialDuplicates(id);
        return ResponseEntity.ok(ApiResponse.ok(duplicates));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<List<AdminAuditLog>>> getAuditLogs() {
        List<AdminAuditLog> logs = adminService.getAuditLogs();
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
