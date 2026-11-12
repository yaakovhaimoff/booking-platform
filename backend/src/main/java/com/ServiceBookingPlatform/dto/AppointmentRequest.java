package com.ServiceBookingPlatform.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AppointmentRequest {

    @NotNull
    private Long serviceId;

    @NotBlank @Size(min = 1, max = 100)
    private String clientName;

    @NotBlank @Pattern(regexp = "\\d{6,15}", message = "Phone must be 6 to 15 digits")
    private String clientPhone;

    @NotBlank
    private String startTime;

    @Size(max = 500)
    private String notes;
}
