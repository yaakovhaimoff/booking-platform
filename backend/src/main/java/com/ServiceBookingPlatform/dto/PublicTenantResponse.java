package com.ServiceBookingPlatform.dto;

import com.ServiceBookingPlatform.entity.TenantEntity;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class PublicTenantResponse {
    private Long id;
    private String slug;
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

    public static PublicTenantResponse from(TenantEntity e) {
        return builder().id(e.getId()).slug(e.getSlug()).name(e.getName())
                .address(e.getAddress()).phone(e.getPhone()).whatsappNumber(e.getWhatsappNumber())
                .logoUrl(e.getLogoUrl()).coverUrl(e.getCoverUrl()).defaultLanguage(e.getDefaultLanguage()).currency(e.getCurrency()).about(e.getAbout())
                .galleryUrls(TenantResponse.splitGallery(e.getGalleryUrls())).build();
    }
}
