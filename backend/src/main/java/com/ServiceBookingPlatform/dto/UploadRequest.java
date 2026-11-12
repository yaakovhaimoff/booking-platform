package com.ServiceBookingPlatform.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UploadRequest {
    @NotBlank
    private String contentType;

    @Min(1)
    @Max(10_000_000)
    private long sizeBytes;
}
