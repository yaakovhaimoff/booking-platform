package com.ServiceBookingPlatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class StatusUpdateRequest {

    @NotBlank
    @Pattern(regexp = "CONFIRMED|CANCELLED")
    private String status;
}
