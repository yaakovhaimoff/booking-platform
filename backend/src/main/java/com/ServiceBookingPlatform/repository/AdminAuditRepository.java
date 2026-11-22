package com.ServiceBookingPlatform.repository;

import com.ServiceBookingPlatform.entity.AdminAuditEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdminAuditRepository extends JpaRepository<AdminAuditEntity, Long> {
    List<AdminAuditEntity> findTop200ByOrderByCreatedAtDescIdDesc();
}
