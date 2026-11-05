package com.ServiceBookingPlatform.dto;

import com.ServiceBookingPlatform.entity.AppointmentEntity;
import lombok.Builder;
import lombok.Data;

import java.time.format.DateTimeFormatter;

@Data @Builder
public class AppointmentResponse {
    private Long id;
    private Long serviceId;
    private String clientName;
    private String clientPhone;
    private String startTime;
    private String endTime;
    private String status;
    private String notes;

    public static AppointmentResponse from(AppointmentEntity e) {
        return AppointmentResponse.builder()
            .id(e.getId())
            .serviceId(e.getServiceId())
            .clientName(e.getClientName())
            .clientPhone(e.getClientPhone())
            .startTime(e.getStartTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .endTime(e.getEndTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .status(e.getStatus().name())
            .notes(e.getNotes())
            .build();
    }
}
