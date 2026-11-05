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

    @Column(length = 3)
    private String currency;

    @Column(name = "default_language", length = 5)
    private String defaultLanguage;

    @Column(name = "schema_name", nullable = false, unique = true)
    private String schemaName;

    @Column(name = "owner_auth0_id", nullable = false, unique = true)
    private String ownerAuth0Id;

    @Column(name = "owner_email")
    private String ownerEmail;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
