package com.bloodlink.bloodlinkbackend.dto;

import com.bloodlink.bloodlinkbackend.enums.BloodGroup;
import com.bloodlink.bloodlinkbackend.enums.Urgency;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBloodRequestDto {

    @NotNull(message = "Blood group is required")
    private BloodGroup bloodGroup;

    @NotNull(message = "Units required is required")
    @Min(value = 1, message = "At least 1 unit must be requested")
    private Integer unitsRequired;

    @NotBlank(message = "Hospital name is required")
    private String hospitalName;

    @NotBlank(message = "City is required")
    private String city;

    private Double latitude;

    private Double longitude;

    @NotNull(message = "Urgency is required")
    private Urgency urgency;

    /**
     * Either provide an explicit future expiresAt or default to expiresInHours.
     */
    @Future(message = "Expiry time must be in the future")
    private LocalDateTime expiresAt;

    private Integer expiresInHours;
}
