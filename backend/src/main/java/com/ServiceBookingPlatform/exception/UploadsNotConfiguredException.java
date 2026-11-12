package com.ServiceBookingPlatform.exception;

public class UploadsNotConfiguredException extends RuntimeException {
    public UploadsNotConfiguredException() {
        super("Image uploads are not configured on this server");
    }
}
