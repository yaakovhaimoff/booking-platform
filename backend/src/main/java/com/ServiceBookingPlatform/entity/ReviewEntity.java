package com.ServiceBookingPlatform.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ReviewEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "author_name", nullable = false, length = 100)
    private String authorName;

    // Set when the reviewer was signed in; null for guest reviews.
    @Column(name = "author_auth0_sub")
    private String authorAuth0Sub;

    @Column(name = "author_account_id")
    private Long authorAccountId;

    @Column(nullable = false)
    private int rating;

    @Column(length = 1000)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
