package com.ServiceBookingPlatform.dto;

import com.ServiceBookingPlatform.entity.TenantEntity;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class AdminTenantResponse {
    private Long id;
    private String slug;
    private String name;
    private String ownerEmail;
    private LocalDateTime createdAt;
    private boolean enabled;

    public static AdminTenantResponse from(TenantEntity e) {
        return builder()
            .id(e.getId()).slug(e.getSlug()).name(e.getName())
            .ownerEmail(e.getOwnerEmail()).createdAt(e.getCreatedAt())
            .enabled(e.isEnabled())
            .build();
    }
}
