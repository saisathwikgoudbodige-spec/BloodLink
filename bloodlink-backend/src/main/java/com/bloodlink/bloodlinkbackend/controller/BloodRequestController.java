package com.bloodlink.bloodlinkbackend.controller;

import com.bloodlink.bloodlinkbackend.dto.*;
import com.bloodlink.bloodlinkbackend.service.BloodRequestService;
import com.bloodlink.bloodlinkbackend.service.MatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class BloodRequestController {

    private final BloodRequestService bloodRequestService;
    private final MatchService matchService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'REQUESTER', 'ADMIN')")
    public ResponseEntity<ApiResponse<BloodRequestDto>> createRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateBloodRequestDto dto) {
        BloodRequestDto created = bloodRequestService.createRequest(userDetails.getUsername(), dto);
        return new ResponseEntity<>(ApiResponse.ok("Blood request created and matching initiated", created), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BloodRequestDto>>> getAllRequests(
            @RequestParam(name = "activeOnly", defaultValue = "false") boolean activeOnly) {
        List<BloodRequestDto> list = activeOnly
                ? bloodRequestService.getActiveRequests()
                : bloodRequestService.getAllRequests();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER', 'REQUESTER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<BloodRequestDto>>> getMyRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<BloodRequestDto> list = bloodRequestService.getMyRequests(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BloodRequestDto>> getRequestById(@PathVariable Long id) {
        BloodRequestDto dto = bloodRequestService.getRequestById(id);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BloodRequestDto>> updateRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BloodRequestUpdateDto dto) {
        BloodRequestDto updated = bloodRequestService.updateRequest(id, userDetails.getUsername(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Blood request updated", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<BloodRequestDto>> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RequestStatusUpdateDto dto) {
        BloodRequestDto updated = bloodRequestService.updateStatus(id, userDetails.getUsername(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Request status updated to " + dto.getStatus(), updated));
    }

    @GetMapping("/{id}/matches")
    public ResponseEntity<ApiResponse<List<MatchDto>>> getMatchesForRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<MatchDto> matches = matchService.getMatchesForRequest(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(matches));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        bloodRequestService.deleteRequest(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok("Blood request cancelled/deleted successfully", null));
    }
}
