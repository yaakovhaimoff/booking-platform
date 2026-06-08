package com.ServiceBookingPlatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OperatingHoursRequest {
    private int dayOfWeek;
    private String openTime;
    private String closeTime;

    @Getter(onMethod_ = {@JsonProperty("isClosed")})
    @Setter(onMethod_ = {@JsonProperty("isClosed")})
    private boolean closed;
}
