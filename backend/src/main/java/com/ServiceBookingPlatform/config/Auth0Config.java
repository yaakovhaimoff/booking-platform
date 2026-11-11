package com.ServiceBookingPlatform.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/**
 * Production validator, active when app.auth.mode=auth0. Not exercised yet: the Auth0 swap is the last
 * roadmap step, and it also needs Auth0 to put email, name and account_type claims on the access token
 * (see AuthenticatedUser.from) and a profile store keyed by subject (see AccountService).
 */
@Configuration
@ConditionalOnProperty(name = "app.auth.mode", havingValue = "auth0")
public class Auth0Config {

    @Bean
    public JwtDecoder jwtDecoder(@Value("${app.auth.auth0.issuer-uri}") String issuerUri,
                                 @Value("${app.auth.auth0.audience}") String audience) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withIssuerLocation(issuerUri).build();
        OAuth2TokenValidator<Jwt> audienceValidator = token -> token.getAudience().contains(audience)
                ? OAuth2TokenValidatorResult.success()
                : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Wrong audience", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuerUri), audienceValidator));
        return decoder;
    }
}
