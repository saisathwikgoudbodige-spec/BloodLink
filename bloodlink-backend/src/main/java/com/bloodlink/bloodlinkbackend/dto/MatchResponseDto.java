package com.bloodlink.bloodlinkbackend.dto;

import com.bloodlink.bloodlinkbackend.enums.MatchStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchResponseDto {

    @NotNull(message = "Response is required (ACCEPTED or DECLINED)")
    private MatchStatus response;
}
