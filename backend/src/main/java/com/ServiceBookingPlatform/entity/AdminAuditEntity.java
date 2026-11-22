package com.ServiceBookingPlatform.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** One permanent record of something an admin did: who, what, to which target, when. */
@Entity
@Table(name = "admin_audit_log")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminAuditEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_identity", nullable = false, length = 255)
    private String adminIdentity;

    @Column(nullable = false, length = 40)
    private String action;

    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType;

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "target_label", length = 255)
    private String targetLabel;

    @Column(length = 1000)
    private String details;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
