package com.ServiceBookingPlatform.repository;

import com.ServiceBookingPlatform.entity.OperatingHoursEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OperatingHoursRepository extends JpaRepository<OperatingHoursEntity, Long> {
    List<OperatingHoursEntity> findByTenantId(Long tenantId);
}
