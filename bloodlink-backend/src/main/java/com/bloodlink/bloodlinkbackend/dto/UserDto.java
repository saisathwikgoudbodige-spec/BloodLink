package com.bloodlink.bloodlinkbackend.dto;

import com.bloodlink.bloodlinkbackend.enums.ApprovalStatus;
import com.bloodlink.bloodlinkbackend.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private boolean active;
    private ApprovalStatus approvalStatus;
    private String rejectionReason;
    private LocalDateTime approvedAt;
    private String approvedByEmail;
    private LocalDateTime createdAt;
    private DonorProfileDto donorProfile;
}
