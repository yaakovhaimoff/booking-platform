package com.ServiceBookingPlatform.config;

import org.springframework.security.oauth2.jwt.Jwt;

/**
 * The caller as the rest of the application sees them. Controllers and services depend on this,
 * never on raw token claims, so changing the token issuer only means changing {@link #from}.
 */
public record AuthenticatedUser(String subject, String email, String name, String accountType, String phone,
                                Long accountId) {

    public static final String BUSINESS = "business";
    public static final String CONSUMER = "consumer";

    public AuthenticatedUser(String subject, String email, String name, String accountType) {
        this(subject, email, name, accountType, null, null);
    }

    public AuthenticatedUser(String subject, String email, String name, String accountType, String phone) {
        this(subject, email, name, accountType, phone, null);
    }

    public static AuthenticatedUser from(Jwt jwt) {
        return new AuthenticatedUser(
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                jwt.getClaimAsString("name"),
                jwt.getClaimAsString("account_type"),
                jwt.getClaimAsString("phone"),
                null);
    }

    /** The same caller with our own account id attached, resolved from the token subject. */
    public AuthenticatedUser withAccountId(Long resolvedAccountId) {
        return new AuthenticatedUser(subject, email, name, accountType, phone, resolvedAccountId);
    }

    /**
     * Whether a stored owner/author/client is this caller. A row that has an account id is compared by account
     * id only; a row from before account ids existed (empty id) falls back to the old provider subject.
     */
    public boolean isSameAs(Long storedAccountId, String storedLegacySubject) {
        if (storedAccountId != null) {
            return storedAccountId.equals(accountId);
        }
        return storedLegacySubject != null && storedLegacySubject.equals(subject);
    }

    public boolean isConsumer() {
        return CONSUMER.equals(accountType);
    }

    public boolean isBusiness() {
        return BUSINESS.equals(accountType);
    }
}
