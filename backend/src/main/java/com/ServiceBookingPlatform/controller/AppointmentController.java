package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.dto.AppointmentRequest;
import com.ServiceBookingPlatform.dto.AppointmentResponse;
import com.ServiceBookingPlatform.dto.StatusUpdateRequest;
import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ResponseEntity<AppointmentResponse> book(@Valid @RequestBody AppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.book(request));
    }

    @GetMapping
    public ResponseEntity<List<AppointmentResponse>> getAppointments(
            @RequestParam(required = false) String status) {
        List<AppointmentResponse> result = appointmentService.getAppointments(status).stream()
                .map(AppointmentResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(
            JwtAuthenticationToken authentication) {
        String sub = authentication.getToken().getSubject();
        List<AppointmentResponse> result = appointmentService.getMyAppointments(sub).stream()
                .map(AppointmentResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            JwtAuthenticationToken authentication) {
        String callerSub = authentication.getToken().getSubject();
        AppointmentEntity updated = appointmentService.updateStatus(id, request.getStatus(), callerSub);
        return ResponseEntity.ok(AppointmentResponse.from(updated));
    }
}
