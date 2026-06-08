package com.ServiceBookingPlatform.repository;

import com.ServiceBookingPlatform.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {}
