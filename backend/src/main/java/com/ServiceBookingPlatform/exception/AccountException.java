package com.ServiceBookingPlatform.exception;

import org.springframework.http.HttpStatus;

/** A sign-up or login failure. The code is part of the API: the frontend maps it to a message. */
public class AccountException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public AccountException(HttpStatus status, String code) {
        super(code);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
