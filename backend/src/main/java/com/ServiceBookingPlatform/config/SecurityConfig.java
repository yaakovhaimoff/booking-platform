package com.ServiceBookingPlatform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Every request is denied unless listed here as public. Public routes still accept an optional bearer
 * token, so a signed-in customer's booking or review is tied to their account while a guest's is not.
 * Which tenant a caller may manage is checked per request by OwnerGuard, not here.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/signup", "/api/v1/auth/login").permitAll()
                .requestMatchers("/api/v1/tenants/me").authenticated()
                .requestMatchers(HttpMethod.GET,
                        "/api/v1/tenants", "/api/v1/tenants/{slug}",
                        "/api/v1/services", "/api/v1/operating-hours",
                        "/api/v1/slots", "/api/v1/slots/open-dates",
                        "/api/v1/reviews").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/appointments", "/api/v1/reviews").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }
}
