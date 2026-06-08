package com.ServiceBookingPlatform.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "services")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ServiceEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
}
