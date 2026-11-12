package com.ServiceBookingPlatform.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tenants")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class TenantEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String slug;

    @Column(length = 100)
    private String name;

    @Column(length = 255)
    private String address;

    @Column(length = 30)
    private String phone;

    @Column(name = "whatsapp_number", length = 30)
    private String whatsappNumber;

    @Column(name = "logo_url", length = 1000)
    private String logoUrl;

    @Column(name = "cover_url", length = 1000)
    private String coverUrl;

    @Column(length = 1000)
    private String about;

    // Newline-separated image URLs for the booking page gallery (links only, no uploads yet).
    @Column(name = "gallery_urls", columnDefinition = "TEXT")
    private String galleryUrls;

    @Column(length = 3)
    private String currency;

    // IANA zone id, e.g. "Europe/Rome". Null means Europe/Rome. Slots and "now" are computed in it.
    @Column(length = 50)
    private String timezone;

    @Column(name = "default_language", length = 5)
    private String defaultLanguage;

    @Column(name = "schema_name", nullable = false, unique = true)
    private String schemaName;

    @Column(name = "owner_auth0_id", nullable = false, unique = true)
    private String ownerAuth0Id;

    // Our own account id for the owner. Replaces ownerAuth0Id, which stays until the cleanup change.
    @Column(name = "owner_account_id", unique = true)
    private Long ownerAccountId;

    @Column(name = "owner_email")
    private String ownerEmail;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
