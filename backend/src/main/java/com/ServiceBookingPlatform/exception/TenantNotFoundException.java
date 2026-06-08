package com.ServiceBookingPlatform.exception;

public class TenantNotFoundException extends RuntimeException {
    public TenantNotFoundException(String slug) {
        super("Tenant not found: " + slug);
    }
}
