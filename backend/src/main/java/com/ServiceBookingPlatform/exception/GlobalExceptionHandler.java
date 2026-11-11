package com.ServiceBookingPlatform.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import com.ServiceBookingPlatform.exception.TenantNotFoundException;
import com.ServiceBookingPlatform.exception.TenantDisabledException;
import com.ServiceBookingPlatform.exception.SlugAlreadyTakenException;
import com.ServiceBookingPlatform.exception.AppointmentNotFoundException;
import com.ServiceBookingPlatform.exception.InvalidTransitionException;
import com.ServiceBookingPlatform.exception.ForbiddenException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ServiceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleServiceNotFound(ServiceNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "SERVICE_NOT_FOUND");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            fields.put(fe.getField(), fe.getDefaultMessage());
        }
        Map<String, Object> body = new HashMap<>();
        body.put("error", "VALIDATION_ERROR");
        body.put("fields", fields);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(InvalidDateException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidDate(InvalidDateException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "INVALID_DATE");
        body.put("message", ex.getMessage());
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(TenantNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleTenantNotFound(TenantNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("error", "TENANT_NOT_FOUND", "message", ex.getMessage()));
    }

    @ExceptionHandler(TenantDisabledException.class)
    public ResponseEntity<Map<String, String>> handleTenantDisabled(TenantDisabledException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("error", "TENANT_DISABLED"));
    }

    @ExceptionHandler(SlugAlreadyTakenException.class)
    public ResponseEntity<Map<String, String>> handleSlugTaken(SlugAlreadyTakenException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("error", "SLUG_TAKEN", "message", ex.getMessage()));
    }

    @ExceptionHandler(AppointmentNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleAppointmentNotFound(AppointmentNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("error", "APPOINTMENT_NOT_FOUND", "message", ex.getMessage()));
    }

    @ExceptionHandler(InvalidTransitionException.class)
    public ResponseEntity<Map<String, String>> handleInvalidTransition(InvalidTransitionException ex) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", "INVALID_TRANSITION", "message", ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, String>> handleForbidden(ForbiddenException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("error", "FORBIDDEN", "message", ex.getMessage()));
    }

    @ExceptionHandler(SlotTakenException.class)
    public ResponseEntity<Map<String, Object>> handleSlotTaken(SlotTakenException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "SLOT_TAKEN");
        body.put("message", ex.getMessage());
        body.put("slots", ex.getFreshSlots());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "VALIDATION_ERROR");
        body.put("message", ex.getMessage());
        return ResponseEntity.badRequest().body(body);
    }
}
