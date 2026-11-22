package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.entity.AdminAuditEntity;
import com.ServiceBookingPlatform.repository.AdminAuditRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/** The permanent record of admin actions. Every entry is also written to the application log. */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminAuditService {

    private final AdminAuditRepository adminAuditRepository;

    public AdminAuditEntity record(String adminIdentity, String action, String targetType, Long targetId,
                                   String targetLabel, String details) {
        log.info("ADMIN AUDIT: {} did {} on {} {} ({}) {}", adminIdentity, action, targetType, targetId,
                targetLabel, details);
        return adminAuditRepository.save(AdminAuditEntity.builder()
                .adminIdentity(adminIdentity)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .targetLabel(targetLabel)
                .details(details)
                .createdAt(LocalDateTime.now())
                .build());
    }

    public List<AdminAuditEntity> latest() {
        return adminAuditRepository.findTop200ByOrderByCreatedAtDescIdDesc();
    }
}
