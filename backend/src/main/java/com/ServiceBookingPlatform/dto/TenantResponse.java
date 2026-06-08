package com.ServiceBookingPlatform.dto;

import com.ServiceBookingPlatform.entity.TenantEntity;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class TenantResponse {
    private Long id;
    private String slug;
    private String schemaName;

    public static TenantResponse from(TenantEntity entity) {
        return TenantResponse.builder()
                .id(entity.getId())
                .slug(entity.getSlug())
                .schemaName(entity.getSchemaName())
                .build();
    }
}
