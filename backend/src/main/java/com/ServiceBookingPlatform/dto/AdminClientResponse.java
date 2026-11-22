package com.ServiceBookingPlatform.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** One client of one shop. A person who booked in two shops appears once per shop. */
@Data @Builder
public class AdminClientResponse {
    private Long shopId;
    private String shopName;
    private String shopSlug;
    private Long accountId;
    private String name;
    private String phone;
    private String email;
    private int bookingCount;
    private int reviewCount;
    private LocalDateTime lastBooking;
}
