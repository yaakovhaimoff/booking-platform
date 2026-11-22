package com.ServiceBookingPlatform.dto;

import com.ServiceBookingPlatform.entity.AdminAuditEntity;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class AdminAuditResponse {
    private Long id;
    private String adminIdentity;
    private String action;
    private String targetType;
    private Long targetId;
    private String targetLabel;
    private String details;
    private LocalDateTime createdAt;

    public static AdminAuditResponse from(AdminAuditEntity e) {
        return builder().id(e.getId()).adminIdentity(e.getAdminIdentity()).action(e.getAction())
            .targetType(e.getTargetType()).targetId(e.getTargetId()).targetLabel(e.getTargetLabel())
            .details(e.getDetails()).createdAt(e.getCreatedAt()).build();
    }
}
