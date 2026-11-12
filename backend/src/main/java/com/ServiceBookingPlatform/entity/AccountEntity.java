package com.ServiceBookingPlatform.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Login credentials, stored server-side so an account works on any device. Identity = lowercased email or +countrycode phone. */
@Entity
@Table(name = "accounts")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AccountEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String identity;

    @Column(length = 100)
    private String name;

    // Digits only; the number the customer wants prefilled in bookings. Optional.
    @Column(length = 30)
    private String phone;

    // "consumer" or "business". Null on accounts made before types existed; set on their next login.
    @Column(name = "account_type", length = 20)
    private String accountType;

    // The identity provider's id for this account ("local|<id>" today). The only place that value is stored.
    @Column(name = "auth_subject", unique = true, length = 255)
    private String authSubject;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
