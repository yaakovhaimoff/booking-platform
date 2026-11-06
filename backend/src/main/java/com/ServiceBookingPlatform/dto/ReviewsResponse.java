package com.ServiceBookingPlatform.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data @Builder
public class ReviewsResponse {
    private double average;
    private int count;
    private List<ReviewResponse> reviews;
}
