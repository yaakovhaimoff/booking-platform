package com.ServiceBookingPlatform.exception;

public class ServiceNotFoundException extends RuntimeException {
    public ServiceNotFoundException(Long id) {
        super("Service not found: " + id);
    }
}
