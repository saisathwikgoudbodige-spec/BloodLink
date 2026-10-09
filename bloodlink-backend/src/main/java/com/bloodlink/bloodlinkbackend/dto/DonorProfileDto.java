package com.bloodlink.bloodlinkbackend.dto;

import com.bloodlink.bloodlinkbackend.enums.AvailabilityStatus;
import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DonorProfileDto {

    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private BloodGroup bloodGroup;
    private String bloodGroupLabel;
    private String city;
    private Double latitude;
    private Double longitude;
    private AvailabilityStatus availabilityStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
