package com.bloodlink.bloodlinkbackend.dto;

import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import com.bloodlink.bloodlinkbackend.enums.RequestStatus;
import com.bloodlink.bloodlinkbackend.enums.Urgency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BloodRequestDto {

    private Long id;
    private Long requesterId;
    private String requesterName;
    private String requesterPhone;
    private String requesterEmail;
    private BloodGroup bloodGroup;
    private String bloodGroupLabel;
    private Integer unitsRequired;
    private String hospitalName;
    private String city;
    private Double latitude;
    private Double longitude;
    private Urgency urgency;
    private LocalDateTime expiresAt;
    private RequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private int totalMatches;
    private int acceptedMatches;

    @Builder.Default
    private String medicalDisclaimer = "Notice: Compatibility is determined according to configured application matching rules and is awaiting medical verification. Final medical verification, cross-matching, and transfusion decisions must remain with authorized healthcare professionals.";
}
