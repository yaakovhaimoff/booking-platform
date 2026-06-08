package com.ServiceBookingPlatform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Tenant registry: slug resolution is public; onboarding requires a JWT
                .requestMatchers(HttpMethod.GET,  "/api/v1/tenants/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/tenants").authenticated()
                // Guest booking endpoints are public (auth comes in Phase 3+)
                .requestMatchers(HttpMethod.GET,  "/api/v1/services").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/v1/slots").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/appointments").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }
}
