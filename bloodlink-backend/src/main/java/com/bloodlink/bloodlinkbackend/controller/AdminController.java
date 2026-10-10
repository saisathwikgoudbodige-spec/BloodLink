package com.bloodlink.bloodlinkbackend.controller;

import com.bloodlink.bloodlinkbackend.dto.*;
import com.bloodlink.bloodlinkbackend.entity.AdminAuditLog;
import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import com.bloodlink.bloodlinkbackend.enums.RequestStatus;
import com.bloodlink.bloodlinkbackend.enums.Urgency;
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

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AdminSummaryDto>> getSummary(@AuthenticationPrincipal UserDetails userDetails) {
        AdminSummaryDto summary = adminService.getSummary(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        List<UserDto> users = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id) {
        UserDto user = adminService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @GetMapping("/users/pending")
    public ResponseEntity<ApiResponse<List<UserDto>>> getPendingUsers() {
        List<UserDto> pending = adminService.getPendingUsers();
        return ResponseEntity.ok(ApiResponse.ok(pending));
    }

    @PostMapping("/users/{id}/approve")
    public ResponseEntity<ApiResponse<UserDto>> approveUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserDto approved = adminService.approveUser(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("User registration approved successfully", approved));
    }

    @PostMapping("/users/{id}/reject")
    public ResponseEntity<ApiResponse<UserDto>> rejectUser(
            @PathVariable Long id,
            @RequestBody(required = false) RejectUserRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String reason = request != null ? request.getReason() : null;
        UserDto rejected = adminService.rejectUser(id, reason, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("User registration rejected", rejected));
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
    public ResponseEntity<ApiResponse<List<BloodRequestDto>>> getRequests(
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(required = false) Urgency urgency,
            @RequestParam(required = false) BloodGroup bloodGroup) {
        List<BloodRequestDto> list = adminService.getFilteredRequests(status, urgency, bloodGroup);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PatchMapping("/requests/{id}/status")
    public ResponseEntity<ApiResponse<BloodRequestDto>> updateRequestStatus(
            @PathVariable Long id,
            @RequestBody RequestStatusUpdateDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        BloodRequestDto updated = adminService.updateRequestStatus(id, dto.getStatus(), dto.getReason(), userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Blood request status updated", updated));
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
