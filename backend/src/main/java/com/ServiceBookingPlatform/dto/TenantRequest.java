package com.ServiceBookingPlatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TenantRequest {
    // Optional: ignored by onboarding, which generates a unique slug from the name.
    @Pattern(regexp = "^[a-z0-9-]{3,50}$", message = "Slug must be 3–50 chars: lowercase letters, digits, hyphens only")
    private String slug;

    @NotBlank
    @Size(max = 100, message = "Business name must be 100 characters or fewer")
    private String name;
}
