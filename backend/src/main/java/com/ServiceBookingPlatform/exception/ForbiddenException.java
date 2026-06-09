package com.ServiceBookingPlatform.exception;

public class ForbiddenException extends RuntimeException {
    public ForbiddenException() {
        super("Access denied");
    }

    public ForbiddenException(String message) {
        super(message);
    }
}
