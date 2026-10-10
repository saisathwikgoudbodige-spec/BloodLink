package com.bloodlink.bloodlinkbackend.controller;

import com.bloodlink.bloodlinkbackend.dto.ApiResponse;
import com.bloodlink.bloodlinkbackend.dto.DonorAvailabilityRequest;
import com.bloodlink.bloodlinkbackend.dto.DonorProfileDto;
import com.bloodlink.bloodlinkbackend.dto.DonorProfileUpdateRequest;
import com.bloodlink.bloodlinkbackend.dto.MatchDto;
import com.bloodlink.bloodlinkbackend.service.DonorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/donors")
@RequiredArgsConstructor
public class DonorController {

    private final DonorService donorService;

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('USER', 'DONOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DonorProfileDto>> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        DonorProfileDto profile = donorService.getProfileByEmail(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasAnyRole('USER', 'DONOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DonorProfileDto>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DonorProfileUpdateRequest request) {
        DonorProfileDto updated = donorService.updateProfile(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Donor profile updated successfully", updated));
    }

    @PatchMapping("/availability")
    @PreAuthorize("hasAnyRole('USER', 'DONOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<DonorProfileDto>> updateAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody DonorAvailabilityRequest request) {
        DonorProfileDto updated = donorService.updateAvailability(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.ok("Availability status updated", updated));
    }

    @GetMapping("/matches")
    @PreAuthorize("hasAnyRole('USER', 'DONOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MatchDto>>> getMyMatches(@AuthenticationPrincipal UserDetails userDetails) {
        List<MatchDto> matches = donorService.getDonorMatches(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(matches));
    }
}
