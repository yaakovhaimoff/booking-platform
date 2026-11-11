package com.ServiceBookingPlatform.dto;

/** Sign-up and login body. accountType is "consumer" or "business"; name is only used at sign-up. */
public record CredentialsRequest(String identity, String password, String name, String accountType) {}
