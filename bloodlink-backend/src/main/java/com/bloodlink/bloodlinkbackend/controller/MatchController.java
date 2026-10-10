package com.bloodlink.bloodlinkbackend.controller;

import com.bloodlink.bloodlinkbackend.dto.ApiResponse;
import com.bloodlink.bloodlinkbackend.dto.MatchDto;
import com.bloodlink.bloodlinkbackend.dto.MatchResponseDto;
import com.bloodlink.bloodlinkbackend.service.MatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('USER', 'DONOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MatchDto>>> getMyMatches(@AuthenticationPrincipal UserDetails userDetails) {
        List<MatchDto> matches = matchService.getMyMatches(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.ok(matches));
    }

    @PatchMapping("/{id}/respond")
    @PreAuthorize("hasAnyRole('USER', 'DONOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<MatchDto>> respondToMatch(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody MatchResponseDto dto) {
        MatchDto updated = matchService.respondToMatch(id, userDetails.getUsername(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Response recorded: " + dto.getResponse(), updated));
    }
}
