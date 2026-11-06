package com.ServiceBookingPlatform.dto;

import com.ServiceBookingPlatform.entity.TenantEntity;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class TenantResponse {
    private Long id;
    private String slug;
    private String schemaName;
    private String name;
    private String address;
    private String phone;
    private String whatsappNumber;
    private String logoUrl;
    private String coverUrl;
    private String defaultLanguage;
    private String currency;
    private String about;
    private java.util.List<String> galleryUrls;

    public static TenantResponse from(TenantEntity entity) {
        return TenantResponse.builder()
                .id(entity.getId())
                .slug(entity.getSlug())
                .schemaName(entity.getSchemaName())
                .name(entity.getName())
                .address(entity.getAddress())
                .phone(entity.getPhone())
                .whatsappNumber(entity.getWhatsappNumber())
                .logoUrl(entity.getLogoUrl())
                .coverUrl(entity.getCoverUrl())
                .defaultLanguage(entity.getDefaultLanguage())
                .currency(entity.getCurrency())
                .about(entity.getAbout())
                .galleryUrls(splitGallery(entity.getGalleryUrls()))
                .build();
    }

    public static java.util.List<String> splitGallery(String raw) {
        return raw == null || raw.isBlank() ? java.util.List.of()
                : java.util.Arrays.stream(raw.split("\\n")).filter(u -> !u.isBlank()).toList();
    }
}
