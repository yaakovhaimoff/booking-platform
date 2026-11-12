package com.ServiceBookingPlatform.config;

import org.springframework.security.oauth2.jwt.Jwt;

/**
 * The caller as the rest of the application sees them. Controllers and services depend on this,
 * never on raw token claims, so changing the token issuer only means changing {@link #from}.
 */
public record AuthenticatedUser(String subject, String email, String name, String accountType, String phone) {

    public static final String BUSINESS = "business";
    public static final String CONSUMER = "consumer";

    public AuthenticatedUser(String subject, String email, String name, String accountType) {
        this(subject, email, name, accountType, null);
    }

    public static AuthenticatedUser from(Jwt jwt) {
        return new AuthenticatedUser(
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                jwt.getClaimAsString("name"),
                jwt.getClaimAsString("account_type"),
                jwt.getClaimAsString("phone"));
    }

    public boolean isConsumer() {
        return CONSUMER.equals(accountType);
    }

    public boolean isBusiness() {
        return BUSINESS.equals(accountType);
    }
}
