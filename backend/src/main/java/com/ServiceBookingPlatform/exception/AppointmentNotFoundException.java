package com.ServiceBookingPlatform.exception;

public class AppointmentNotFoundException extends RuntimeException {
    public AppointmentNotFoundException(Long id) {
        super("Appointment not found: " + id);
    }
}
