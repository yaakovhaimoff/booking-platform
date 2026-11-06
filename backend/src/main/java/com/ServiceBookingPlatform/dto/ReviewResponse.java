package com.ServiceBookingPlatform.dto;

import com.ServiceBookingPlatform.entity.ReviewEntity;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data @Builder
public class ReviewResponse {
    private Long id;
    private String authorName;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;

    // authorAuth0Sub is deliberately not exposed publicly.
    public static ReviewResponse from(ReviewEntity e) {
        return builder().id(e.getId()).authorName(e.getAuthorName()).rating(e.getRating())
                .comment(e.getComment()).createdAt(e.getCreatedAt()).build();
    }
}
