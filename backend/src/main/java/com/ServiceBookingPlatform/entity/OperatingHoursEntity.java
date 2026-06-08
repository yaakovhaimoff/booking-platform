package com.ServiceBookingPlatform.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "operating_hours")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OperatingHoursEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "day_of_week", nullable = false)
    private int dayOfWeek;

    @Column(name = "open_time")
    private String openTime;

    @Column(name = "close_time")
    private String closeTime;

    @Getter(onMethod_ = {@JsonProperty("isClosed")})
    @Setter(onMethod_ = {@JsonProperty("isClosed")})
    @Column(name = "is_closed", nullable = false)
    private boolean closed;
}
