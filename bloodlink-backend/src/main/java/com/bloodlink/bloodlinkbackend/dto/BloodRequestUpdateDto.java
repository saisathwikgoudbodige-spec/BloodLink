package com.bloodlink.bloodlinkbackend.dto;

import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import com.bloodlink.bloodlinkbackend.enums.Urgency;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BloodRequestUpdateDto {

    private BloodGroup bloodGroup;

    @Min(value = 1, message = "At least 1 unit must be requested")
    private Integer unitsRequired;

    private String hospitalName;

    private String city;

    private Double latitude;

    private Double longitude;

    private Urgency urgency;

    @Future(message = "Expiry time must be in the future")
    private LocalDateTime expiresAt;
}
