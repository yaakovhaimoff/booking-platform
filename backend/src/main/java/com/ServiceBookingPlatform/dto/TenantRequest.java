package com.ServiceBookingPlatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class TenantRequest {
    @NotBlank
    @Pattern(regexp = "^[a-z0-9-]{3,50}$", message = "Slug must be 3–50 chars: lowercase letters, digits, hyphens only")
    private String slug;
}
