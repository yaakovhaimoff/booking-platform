package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.dto.AppointmentRequest;
import com.ServiceBookingPlatform.dto.AppointmentResponse;
import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.AppointmentStatus;
import com.ServiceBookingPlatform.entity.ServiceEntity;
import com.ServiceBookingPlatform.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ServiceCatalogService serviceCatalogService;

    public AppointmentResponse book(AppointmentRequest request) {
        ServiceEntity service = serviceCatalogService.getById(request.getServiceId());

        LocalDateTime startTime = LocalDateTime.parse(request.getStartTime(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        LocalDateTime endTime = startTime.plusMinutes(service.getDurationMinutes());

        AppointmentEntity entity = AppointmentEntity.builder()
            .serviceId(service.getId())
            .clientName(request.getClientName())
            .clientPhone(request.getClientPhone())
            .startTime(startTime)
            .endTime(endTime)
            .status(AppointmentStatus.CONFIRMED)
            .clientAuth0Sub(request.getClientAuth0Sub())
            .build();

        AppointmentEntity saved = appointmentRepository.save(entity);

        return AppointmentResponse.from(saved);
    }
}
