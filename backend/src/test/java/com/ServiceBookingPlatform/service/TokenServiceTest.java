package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.config.LocalAuthConfig;
import com.ServiceBookingPlatform.entity.AccountEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class TokenServiceTest {

    private static final String SECRET = "unit-test-secret-unit-test-secret-1234";

    private TokenService tokenService;
    private JwtDecoder decoder;

    private static LocalAuthConfig config(String secret) {
        LocalAuthConfig config = new LocalAuthConfig();
        ReflectionTestUtils.setField(config, "configuredSecret", secret);
        return config;
    }

    @BeforeEach
    void setUp() {
        LocalAuthConfig config = config(SECRET);
        SecretKey key = config.localSigningKey();
        tokenService = new TokenService(config.jwtEncoder(key));
        ReflectionTestUtils.setField(tokenService, "tokenHours", 2L);
        decoder = config.jwtDecoder(key);
    }

    private AccountEntity account(String identity, String name, String type) {
        return AccountEntity.builder().id(42L).identity(identity).name(name).accountType(type).build();
    }

    @Test
    void anIssuedTokenCarriesTheClaimsTheApplicationReads() {
        Jwt jwt = decoder.decode(tokenService.issue(account("owner@torni.test", "Owner", "business")));

        AuthenticatedUser user = AuthenticatedUser.from(jwt);
        assertEquals("local|42", user.subject());
        assertEquals("owner@torni.test", user.email());
        assertEquals("Owner", user.name());
        assertEquals("business", user.accountType());
        assertTrue(user.isBusiness());
        assertEquals(LocalAuthConfig.ISSUER, jwt.getClaimAsString("iss"));
    }

    @Test
    void aPhoneIdentityHasNoEmailClaim() {
        AuthenticatedUser user = AuthenticatedUser.from(
                decoder.decode(tokenService.issue(account("+39333000111", null, "consumer"))));

        assertNull(user.email());
        assertNull(user.name());
        assertFalse(user.isBusiness());
    }

    @Test
    void thePhoneClaimIsTheProfilePhoneInDigits() {
        AccountEntity withProfilePhone = account("ann@torni.test", "Ann", "consumer");
        withProfilePhone.setPhone("393331112222");

        assertEquals("393331112222", AuthenticatedUser.from(decoder.decode(tokenService.issue(withProfilePhone))).phone());
    }

    @Test
    void aPhoneLoginUsesItsOwnNumberWhenNoProfilePhoneIsSaved() {
        AuthenticatedUser user = AuthenticatedUser.from(
                decoder.decode(tokenService.issue(account("+39 333 111 2222", "Ann", "consumer"))));

        assertEquals("393331112222", user.phone());
    }

    @Test
    void theProfilePhoneWinsOverTheLoginNumber() {
        AccountEntity account = account("+39333000111", "Ann", "consumer");
        account.setPhone("3331112222");

        assertEquals("3331112222", AuthenticatedUser.from(decoder.decode(tokenService.issue(account))).phone());
    }

    @Test
    void anEmailLoginWithoutAProfilePhoneHasNoPhoneClaim() {
        assertNull(AuthenticatedUser.from(decoder.decode(tokenService.issue(account("ann@torni.test", "Ann", "consumer")))).phone());
    }

    @Test
    void theTokenExpiresAfterTheConfiguredHours() {
        Jwt jwt = decoder.decode(tokenService.issue(account("a@torni.test", "A", "consumer")));

        long hours = Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt()).toHours();
        assertEquals(2, hours);
        assertTrue(jwt.getExpiresAt().isAfter(Instant.now()));
    }

    @Test
    void aTokenFromAnotherKeyIsRejected() {
        LocalAuthConfig other = config("another-secret-another-secret-123456");
        TokenService foreign = new TokenService(other.jwtEncoder(other.localSigningKey()));
        ReflectionTestUtils.setField(foreign, "tokenHours", 2L);

        assertThrows(BadJwtException.class, () -> decoder.decode(foreign.issue(account("a@torni.test", "A", "consumer"))));
    }

    @Test
    void aTamperedPayloadIsRejected() {
        String[] parts = tokenService.issue(account("a@torni.test", "A", "consumer")).split("\\.");
        String forgedPayload = java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(
                "{\"sub\":\"local|1\",\"iss\":\"torni-local\",\"exp\":9999999999}".getBytes());

        assertThrows(BadJwtException.class, () -> decoder.decode(parts[0] + "." + forgedPayload + "." + parts[2]));
    }

    @Test
    void aShortSigningSecretIsRefused() {
        assertThrows(IllegalStateException.class, () -> config("too-short").localSigningKey());
    }

    @Test
    void aMissingSecretFallsBackToARandomKeyThatStillWorks() {
        LocalAuthConfig config = config("");
        SecretKey key = config.localSigningKey();
        TokenService random = new TokenService(config.jwtEncoder(key));
        ReflectionTestUtils.setField(random, "tokenHours", 1L);

        assertNotNull(config.jwtDecoder(key).decode(random.issue(account("a@torni.test", "A", "consumer"))));
        assertThrows(BadJwtException.class, () -> decoder.decode(random.issue(account("a@torni.test", "A", "consumer"))));
    }
}
