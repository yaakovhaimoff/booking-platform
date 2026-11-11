package com.ServiceBookingPlatform.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Token issuer and validator used while app.auth.mode=local. The backend signs its own HS256 tokens at
 * login and validates them like any other bearer JWT. {@link Auth0Config} replaces this in production.
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "app.auth.mode", havingValue = "local", matchIfMissing = true)
public class LocalAuthConfig {

    public static final String ISSUER = "torni-local";

    @Value("${app.auth.local.secret:}")
    private String configuredSecret;

    @Bean
    public SecretKey localSigningKey() {
        String secret = configuredSecret;
        if (secret == null || secret.isBlank()) {
            byte[] random = new byte[32];
            new SecureRandom().nextBytes(random);
            secret = HexFormat.of().formatHex(random);
            log.warn("AUTH_LOCAL_SECRET is not set: using a random signing key, so every login is invalidated on restart");
        }
        if (secret.length() < 32) {
            throw new IllegalStateException("AUTH_LOCAL_SECRET must be at least 32 characters");
        }
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey localSigningKey) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(localSigningKey));
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey localSigningKey) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(localSigningKey)
                .macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(ISSUER));
        return decoder;
    }
}
