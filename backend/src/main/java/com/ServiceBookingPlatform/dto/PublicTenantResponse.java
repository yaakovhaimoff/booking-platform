package com.ServiceBookingPlatform.dto;

import com.ServiceBookingPlatform.entity.TenantEntity;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class PublicTenantResponse {
    private Long id;
    private String slug;
    private String name;

    public static PublicTenantResponse from(TenantEntity e) {
        return builder().id(e.getId()).slug(e.getSlug()).name(e.getName()).build();
    }
}
