package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.config.OwnerGuard;
import com.ServiceBookingPlatform.dto.AppointmentRequest;
import com.ServiceBookingPlatform.dto.AppointmentResponse;
import com.ServiceBookingPlatform.dto.StatusUpdateRequest;
import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final OwnerGuard ownerGuard;

    @PostMapping
    public ResponseEntity<AppointmentResponse> book(@Valid @RequestBody AppointmentRequest request,
                                                    AuthenticatedUser user) {
        String clientSubject = user == null ? null : user.subject();
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.book(request, clientSubject));
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAppointments(
            @RequestParam(required = false) String status,
            AuthenticatedUser user) {
        ownerGuard.assertOwnsCurrentTenant(user);
        List<AppointmentResponse> result = appointmentService.getAppointments(status).stream()
                .map(AppointmentResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(AuthenticatedUser user) {
        // Only customer accounts claim guest bookings; an owner's token never pulls customers' bookings.
        String claimPhone = user.isConsumer() ? user.phone() : null;
        List<AppointmentResponse> result = appointmentService.getMyAppointments(user.subject(), user.name(), claimPhone).stream()
                .map(AppointmentResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            AuthenticatedUser user) {
        AppointmentEntity updated = appointmentService.updateStatus(id, request.getStatus(), user.subject());
        return ResponseEntity.ok(AppointmentResponse.from(updated));
    }
}
