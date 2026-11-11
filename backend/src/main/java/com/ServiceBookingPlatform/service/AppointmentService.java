package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.dto.AppointmentRequest;
import com.ServiceBookingPlatform.dto.AppointmentResponse;
import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.AppointmentStatus;
import com.ServiceBookingPlatform.entity.ServiceEntity;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.exception.AppointmentNotFoundException;
import com.ServiceBookingPlatform.exception.ForbiddenException;
import com.ServiceBookingPlatform.exception.InvalidTransitionException;
import com.ServiceBookingPlatform.exception.TenantNotFoundException;
import com.ServiceBookingPlatform.multitenancy.TenantContextHolder;
import com.ServiceBookingPlatform.repository.AppointmentRepository;
import com.ServiceBookingPlatform.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import com.ServiceBookingPlatform.exception.InvalidDateException;
import com.ServiceBookingPlatform.exception.SlotTakenException;
import java.time.format.DateTimeParseException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ServiceCatalogService serviceCatalogService;
    private final TenantRepository tenantRepository;
    private final SlotCalculatorService slotCalculatorService;
    private final NotificationService notificationService;
    private final TransactionTemplate transactionTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    public AppointmentResponse book(AppointmentRequest request, String clientAuth0Sub) {
        ServiceEntity service = serviceCatalogService.getById(request.getServiceId());

        LocalDateTime startTime;
        try {
            startTime = LocalDateTime.parse(request.getStartTime(), DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException e) {
            throw new InvalidDateException("Invalid start time: " + request.getStartTime());
        }
        LocalDateTime endTime = startTime.plusMinutes(service.getDurationMinutes());

        // Check and insert under a per-tenant lock so two simultaneous requests for overlapping
        // times cannot both pass the check. The lock is held until this transaction commits.
        AppointmentEntity saved = transactionTemplate.execute(status -> {
            lockTenantBookings(TenantContextHolder.getTenantId());
            if (!slotCalculatorService.isBookable(startTime, service.getDurationMinutes())) {
                List<String> fresh = slotCalculatorService
                        .getAvailableSlots(startTime.toLocalDate(), service.getDurationMinutes()).stream()
                        .map(d -> d.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)).toList();
                throw new SlotTakenException("That time is no longer available", fresh);
            }
            return appointmentRepository.save(AppointmentEntity.builder()
                    .serviceId(service.getId())
                    .clientName(request.getClientName().trim())
                    .clientPhone(request.getClientPhone())
                    .startTime(startTime)
                    .endTime(endTime)
                    .status(AppointmentStatus.PENDING)
                    .notes(request.getNotes() == null || request.getNotes().isBlank() ? null : request.getNotes().trim())
                    .clientAuth0Sub(clientAuth0Sub)
                    .build());
        });

        log.info("Appointment booked: id={} service={} start={} tenant={}",
                saved.getId(), request.getServiceId(), request.getStartTime(), TenantContextHolder.getTenantId());
        tenantRepository.findById(TenantContextHolder.getTenantId())
                .ifPresent(t -> notificationService.bookingCreated(t, saved, service));
        return AppointmentResponse.from(saved);
    }

    private void lockTenantBookings(Long tenantId) {
        // Advisory lock keyed by tenant id; released automatically at commit/rollback.
        // Cast to text because the function returns void, which Hibernate cannot read.
        entityManager.createNativeQuery("select cast(pg_advisory_xact_lock(:k) as text)")
                .setParameter("k", tenantId)
                .getSingleResult();
    }

    public List<AppointmentEntity> getAppointments(String statusFilter) {
        if (statusFilter != null) {
            try {
                AppointmentStatus status = AppointmentStatus.valueOf(statusFilter);
                return appointmentRepository.findByStatus(status);
            } catch (IllegalArgumentException ignored) {
            }
        }
        return appointmentRepository.findByStatusNot(AppointmentStatus.CANCELLED);
    }

    public AppointmentEntity updateStatus(Long id, String newStatus, String callerAuth0Sub) {
        AppointmentEntity entity = appointmentRepository.findById(id)
                .orElseThrow(() -> new AppointmentNotFoundException(id));

        Long tenantId = TenantContextHolder.getTenantId();
        TenantEntity tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new TenantNotFoundException("id:" + tenantId));

        boolean isOwner = tenant.getOwnerAuth0Id().equals(callerAuth0Sub);
        boolean isClient = entity.getClientAuth0Sub() != null
                && entity.getClientAuth0Sub().equals(callerAuth0Sub);

        if (!isOwner && !isClient) {
            throw new ForbiddenException();
        }

        AppointmentStatus parsed;
        try {
            parsed = AppointmentStatus.valueOf(newStatus);
        } catch (IllegalArgumentException e) {
            throw new InvalidTransitionException("Unknown status: " + newStatus);
        }

        if (isClient && !isOwner && parsed != AppointmentStatus.CANCELLED) {
            throw new InvalidTransitionException("Clients may only cancel appointments");
        }

        AppointmentStatus current = entity.getStatus();
        boolean valid = (current == AppointmentStatus.PENDING && parsed == AppointmentStatus.CONFIRMED)
                || (current == AppointmentStatus.PENDING && parsed == AppointmentStatus.CANCELLED)
                || (current == AppointmentStatus.CONFIRMED && parsed == AppointmentStatus.CANCELLED);

        if (!valid) {
            throw new InvalidTransitionException(current + " → " + parsed);
        }

        entity.setStatus(parsed);
        AppointmentEntity updated = appointmentRepository.save(entity);
        log.info("Appointment status updated: id={} {} → {} by={}",
                id, current, parsed, callerAuth0Sub);
        notificationService.statusChanged(tenant, updated, isOwner);
        return updated;
    }

    public List<AppointmentEntity> getMyAppointments(String clientAuth0Sub) {
        return appointmentRepository.findByClientAuth0SubOrderByStartTimeDesc(clientAuth0Sub);
    }
}
