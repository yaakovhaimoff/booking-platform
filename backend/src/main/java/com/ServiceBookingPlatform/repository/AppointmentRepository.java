package com.ServiceBookingPlatform.repository;

import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long> {
    List<AppointmentEntity> findByStartTimeBetweenAndStatusIn(
            LocalDateTime from,
            LocalDateTime to,
            List<AppointmentStatus> statuses
    );

    // Appointments that overlap the window [from, to): start < to AND end > from.
    @org.springframework.data.jpa.repository.Query(
        "select a from AppointmentEntity a where a.startTime < :to and a.endTime > :from and a.status in :statuses")
    List<AppointmentEntity> findOverlapping(
            @org.springframework.data.repository.query.Param("from") LocalDateTime from,
            @org.springframework.data.repository.query.Param("to") LocalDateTime to,
            @org.springframework.data.repository.query.Param("statuses") List<AppointmentStatus> statuses
    );

    List<AppointmentEntity> findByStatus(AppointmentStatus status);

    List<AppointmentEntity> findByStatusNot(AppointmentStatus status);

    List<AppointmentEntity> findByClientAuth0SubOrderByStartTimeDesc(String clientAuth0Sub);
}
