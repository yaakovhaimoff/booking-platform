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
    private Long ownerAccountId;
    private LocalDateTime createdAt;
    private boolean enabled;
    // A shop is shown to the public exactly when it is enabled.
    private boolean visibleToPublic;
    private int bookingCount;
    private int reviewCount;
    private LocalDateTime lastActivity;

    public static AdminTenantResponse from(TenantEntity e) {
        return from(e, 0, 0, null);
    }

    public static AdminTenantResponse from(TenantEntity e, int bookingCount, int reviewCount, LocalDateTime lastActivity) {
        return builder()
            .id(e.getId()).slug(e.getSlug()).name(e.getName())
            .ownerEmail(e.getOwnerEmail()).ownerAccountId(e.getOwnerAccountId()).createdAt(e.getCreatedAt())
            .enabled(e.isEnabled()).visibleToPublic(e.isEnabled())
            .bookingCount(bookingCount).reviewCount(reviewCount).lastActivity(lastActivity)
            .build();
    }
}
