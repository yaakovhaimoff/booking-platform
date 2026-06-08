package com.ServiceBookingPlatform.repository;

import com.ServiceBookingPlatform.entity.AppointmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long> {
    List<AppointmentEntity> findByStartTimeBetweenAndStatusIn(
        LocalDateTime from,
        LocalDateTime to,
        List<String> statuses
    );
}
