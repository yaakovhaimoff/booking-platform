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

    // Creates the schema and provisions services + appointments tables.
    // Called once per tenant at onboarding time.
    public void provision(String schemaName) {
        publicJdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + schemaName);

        publicJdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.services (
                id               BIGSERIAL PRIMARY KEY,
                name             VARCHAR(100) NOT NULL,
                duration_minutes INT         NOT NULL,
                price            NUMERIC(10, 2) NOT NULL
            )""".formatted(schemaName));

        publicJdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.appointments (
                id           BIGSERIAL PRIMARY KEY,
                service_id   BIGINT       NOT NULL,
                client_name  VARCHAR(100) NOT NULL,
                client_phone VARCHAR(50)  NOT NULL,
                start_time   TIMESTAMP    NOT NULL,
                status       VARCHAR(20)  NOT NULL DEFAULT 'CONFIRMED'
            )""".formatted(schemaName));
    }
}
