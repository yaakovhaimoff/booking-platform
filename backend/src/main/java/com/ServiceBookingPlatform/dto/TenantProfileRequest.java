package com.ServiceBookingPlatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TenantProfileRequest {
    @NotBlank
    @Size(max = 100)
    private String name;

    @Size(max = 255)
    private String address;

    @Size(max = 30)
    @Pattern(regexp = "^[0-9+\\-\\s()]*$", message = "Phone may contain digits, spaces, + - ( ) only")
    private String phone;

    @Size(max = 30)
    @Pattern(regexp = "^[0-9+\\-\\s()]*$", message = "WhatsApp number may contain digits, spaces, + - ( ) only")
    private String whatsappNumber;

    @Pattern(regexp = "^(EUR|USD|GBP|ILS)?$", message = "Currency must be EUR, USD, GBP or ILS")
    private String currency;

    @Pattern(regexp = "^(en|it)?$", message = "Default language must be 'en' or 'it'")
    private String defaultLanguage;

    @Size(max = 1000)
    @Pattern(regexp = "^(https?://.*)?$", message = "Logo URL must start with http:// or https://")
    private String logoUrl;

    @Size(max = 1000)
    @Pattern(regexp = "^(https?://.*)?$", message = "Cover URL must start with http:// or https://")
    private String coverUrl;
}
