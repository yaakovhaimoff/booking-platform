package com.ServiceBookingPlatform.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class AppointmentResponse {
    private Long id;
    private Long serviceId;
    private String clientName;
    private String clientPhone;
    private String startTime;
    private String endTime;
    private String status;
}
