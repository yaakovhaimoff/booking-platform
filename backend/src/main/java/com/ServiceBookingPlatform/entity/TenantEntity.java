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

    @Column(name = "schema_name", nullable = false, unique = true)
    private String schemaName;

    @Column(name = "owner_auth0_id", nullable = false)
    private String ownerAuth0Id;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
