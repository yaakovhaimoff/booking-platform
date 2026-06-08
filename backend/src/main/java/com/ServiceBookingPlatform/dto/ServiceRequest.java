package com.ServiceBookingPlatform.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ServiceRequest {

    @NotBlank @Size(max = 100)
    private String name;

    @Min(1)
    private int durationMinutes;

    @DecimalMin("0.00")
    private BigDecimal price;
}
