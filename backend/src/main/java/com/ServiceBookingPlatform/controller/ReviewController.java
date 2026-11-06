package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.dto.ReviewRequest;
import com.ServiceBookingPlatform.dto.ReviewResponse;
import com.ServiceBookingPlatform.dto.ReviewsResponse;
import com.ServiceBookingPlatform.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<ReviewsResponse> list() {
        return ResponseEntity.ok(reviewService.list());
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> submit(@Valid @RequestBody ReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.submit(request));
    }
}
