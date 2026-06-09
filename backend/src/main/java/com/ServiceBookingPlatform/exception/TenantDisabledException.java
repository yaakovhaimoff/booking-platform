package com.ServiceBookingPlatform.exception;

public class TenantDisabledException extends RuntimeException {
    public TenantDisabledException(String slug) {
        super("Tenant is disabled: " + slug);
    }
}
