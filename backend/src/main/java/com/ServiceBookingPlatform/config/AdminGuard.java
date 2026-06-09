package com.ServiceBookingPlatform.config;

import com.ServiceBookingPlatform.exception.ForbiddenException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class AdminGuard {

    @Value("${app.admin.emails:}")
    private String adminEmailsCsv;

    public void assertAdmin(JwtAuthenticationToken auth) {
        String email = auth.getToken().getClaimAsString("email");
        Set<String> adminEmails = Arrays.stream(adminEmailsCsv.split(","))
            .map(String::trim).filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
        if (email == null || !adminEmails.contains(email)) {
            throw new ForbiddenException("Not an admin");
        }
    }
}
