package com.ServiceBookingPlatform.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AppointmentEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_id", nullable = false)
    private Long serviceId;

    @Column(name = "client_name", nullable = false, length = 100)
    private String clientName;

    @Column(name = "client_phone", nullable = false)
    private String clientPhone;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AppointmentStatus status;

    @Column(length = 500)
    private String notes;

    @Column(name = "client_auth0_sub")
    private String clientAuth0Sub;

    @Column(name = "client_account_id")
    private Long clientAccountId;
}
