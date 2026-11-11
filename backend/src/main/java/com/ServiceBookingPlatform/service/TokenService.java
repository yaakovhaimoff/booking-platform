package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.LocalAuthConfig;
import com.ServiceBookingPlatform.entity.AccountEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/** Signs access tokens for the local auth mode. The claims match what AuthenticatedUser.from reads. */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.auth.mode", havingValue = "local", matchIfMissing = true)
public class TokenService {

    private final JwtEncoder jwtEncoder;

    @Value("${app.auth.local.token-hours:168}")
    private long tokenHours;

    public String issue(AccountEntity account) {
        Instant now = Instant.now();
        JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer(LocalAuthConfig.ISSUER)
                .subject(AccountService.subjectOf(account))
                .issuedAt(now)
                .expiresAt(now.plus(Duration.ofHours(tokenHours)))
                .claim("account_type", account.getAccountType());
        if (account.getIdentity().contains("@")) {
            claims.claim("email", account.getIdentity());
        }
        if (account.getName() != null && !account.getName().isBlank()) {
            claims.claim("name", account.getName());
        }
        return jwtEncoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims.build())).getTokenValue();
    }
}
