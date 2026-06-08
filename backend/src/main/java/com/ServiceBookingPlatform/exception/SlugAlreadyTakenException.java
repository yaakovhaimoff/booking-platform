package com.ServiceBookingPlatform.exception;

public class SlugAlreadyTakenException extends RuntimeException {
    public SlugAlreadyTakenException(String slug) {
        super("Slug already in use: " + slug);
    }
}
