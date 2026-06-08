package com.ServiceBookingPlatform.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SchemaProvisioningService {

    private final JdbcTemplate publicJdbcTemplate;

    public SchemaProvisioningService(@Qualifier("publicJdbcTemplate") JdbcTemplate publicJdbcTemplate) {
        this.publicJdbcTemplate = publicJdbcTemplate;
    }

    // Creates the schema and provisions all tables with seed data.
    // Called once per tenant at onboarding time.
    public void provision(String schemaName, Long tenantId) {
        publicJdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + schemaName);

        publicJdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.services (
                id               BIGSERIAL PRIMARY KEY,
                name             VARCHAR(100)   NOT NULL,
                duration_minutes INT            NOT NULL,
                price            NUMERIC(10, 2) NOT NULL
            )""".formatted(schemaName));

        publicJdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.appointments (
                id               BIGSERIAL     PRIMARY KEY,
                service_id       BIGINT        NOT NULL,
                client_name      VARCHAR(100)  NOT NULL,
                client_phone     VARCHAR(50)   NOT NULL,
                start_time       TIMESTAMP     NOT NULL,
                end_time         TIMESTAMP     NOT NULL,
                status           VARCHAR(20)   NOT NULL DEFAULT 'CONFIRMED',
                client_auth0_sub VARCHAR(255)
            )""".formatted(schemaName));

        publicJdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.operating_hours (
                id           BIGSERIAL PRIMARY KEY,
                tenant_id    BIGINT    NOT NULL,
                day_of_week  INT       NOT NULL,
                open_time    VARCHAR(5),
                close_time   VARCHAR(5),
                is_closed    BOOLEAN   NOT NULL DEFAULT false
            )""".formatted(schemaName));

        // Seed Mon–Sun with 09:00–17:00 open by default
        for (int day = 0; day <= 6; day++) {
            publicJdbcTemplate.update(
                "INSERT INTO " + schemaName + ".operating_hours (tenant_id, day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)",
                tenantId, day, "09:00", "17:00", false
            );
        }
    }
}
