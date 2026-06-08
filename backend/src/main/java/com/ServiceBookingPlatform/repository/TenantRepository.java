package com.ServiceBookingPlatform.repository;

import com.ServiceBookingPlatform.entity.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantRepository extends JpaRepository<TenantEntity, Long> {
    Optional<TenantEntity> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
