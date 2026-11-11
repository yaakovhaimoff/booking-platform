package com.ServiceBookingPlatform.config;

import com.ServiceBookingPlatform.exception.ForbiddenException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class AdminGuard {

    @Value("${app.admin.emails:}")
    private String adminEmailsCsv;

    public void assertAdmin(AuthenticatedUser user) {
        Set<String> adminEmails = Arrays.stream(adminEmailsCsv.split(","))
            .map(String::trim).filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
        if (user == null || user.email() == null || !adminEmails.contains(user.email())) {
            throw new ForbiddenException("Not an admin");
        }
    }
}
