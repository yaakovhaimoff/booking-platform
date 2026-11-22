package com.ServiceBookingPlatform.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Slf4j
@Service
public class SchemaProvisioningService {

    private static final Pattern TENANT_SCHEMA = Pattern.compile("tenant_\\d+");

    public record ShopStatistics(int bookings, int reviews, LocalDateTime lastActivity) {}

    public record ClientRow(Long accountId, String name, String phone, int bookings, LocalDateTime lastBooking) {}

    private final JdbcTemplate publicJdbcTemplate;

    public SchemaProvisioningService(@Qualifier("publicJdbcTemplate") JdbcTemplate publicJdbcTemplate) {
        this.publicJdbcTemplate = publicJdbcTemplate;
    }

    // Brings an existing tenant schema up to the current DDL without losing data.
    // Safe to run on new schemas too — all statements are idempotent.
    public void migrate(String schemaName, Long tenantId) {
        // appointments — columns added in a5fbccc
        publicJdbcTemplate.execute(
            "ALTER TABLE " + schemaName + ".appointments ADD COLUMN IF NOT EXISTS end_time TIMESTAMP");
        // backfill: old rows have no end_time; default to start_time + 30 min
        publicJdbcTemplate.execute(
            "UPDATE " + schemaName + ".appointments SET end_time = start_time + INTERVAL '30 minutes' WHERE end_time IS NULL");
        publicJdbcTemplate.execute(
            "ALTER TABLE " + schemaName + ".appointments ADD COLUMN IF NOT EXISTS client_auth0_sub VARCHAR(255)");
        publicJdbcTemplate.execute(
            "ALTER TABLE " + schemaName + ".appointments ADD COLUMN IF NOT EXISTS notes VARCHAR(500)");
        publicJdbcTemplate.execute(
            "ALTER TABLE " + schemaName + ".appointments ADD COLUMN IF NOT EXISTS client_account_id BIGINT");

        // operating_hours — entire table added in a5fbccc; seed rows only when table is fresh
        publicJdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.operating_hours (
                id           BIGSERIAL PRIMARY KEY,
                tenant_id    BIGINT    NOT NULL,
                day_of_week  INT       NOT NULL,
                open_time    VARCHAR(5),
                close_time   VARCHAR(5),
                is_closed    BOOLEAN   NOT NULL DEFAULT false
            )""".formatted(schemaName));

        Integer count = publicJdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM " + schemaName + ".operating_hours", Integer.class);
        if (count != null && count == 0) {
            for (int day = 0; day <= 6; day++) {
                publicJdbcTemplate.update(
                    "INSERT INTO " + schemaName + ".operating_hours (tenant_id, day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)",
                    tenantId, day, "09:00", "17:00", false);
            }
            log.info("Seeded operating_hours for schema: {}", schemaName);
        }

        publicJdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.reviews (
                id               BIGSERIAL     PRIMARY KEY,
                author_name      VARCHAR(100)  NOT NULL,
                author_auth0_sub VARCHAR(255),
                rating           INT           NOT NULL,
                comment          VARCHAR(1000),
                created_at       TIMESTAMP     NOT NULL
            )""".formatted(schemaName));
        publicJdbcTemplate.execute(
            "ALTER TABLE " + schemaName + ".reviews ADD COLUMN IF NOT EXISTS author_account_id BIGINT");

        backfillAccountIds(schemaName);

        log.info("Migration complete for schema: {}", schemaName);
    }

    // Fills accounts.auth_subject and tenants.owner_account_id from the existing "local|<id>" subjects.
    // Only touches rows still empty, so running it any number of times gives the same result.
    // Returns how many tenants still have no owner account; each one is logged as a warning.
    public int backfillPublicIdentity() {
        publicJdbcTemplate.update(
            "UPDATE public.accounts SET auth_subject = 'local|' || id WHERE auth_subject IS NULL");
        publicJdbcTemplate.update("""
            UPDATE public.tenants t SET owner_account_id = a.id
            FROM public.accounts a
            WHERE t.owner_account_id IS NULL AND t.owner_auth0_id = a.auth_subject""");
        List<String> unmapped = publicJdbcTemplate.queryForList(
            "SELECT id || ' (' || slug || ')' FROM public.tenants WHERE owner_account_id IS NULL ORDER BY id",
            String.class);
        unmapped.forEach(tenant -> log.warn("IDENTITY BACKFILL: tenant {} has no matching owner account", tenant));
        return unmapped.size();
    }

    // Same for one tenant schema: appointments.client_account_id and reviews.author_account_id.
    // Returns the number of rows that carry an old subject but could not be mapped to an account.
    public int backfillAccountIds(String schemaName) {
        publicJdbcTemplate.update("UPDATE " + schemaName + ".appointments p SET client_account_id = a.id "
            + "FROM public.accounts a WHERE p.client_account_id IS NULL AND p.client_auth0_sub = a.auth_subject");
        publicJdbcTemplate.update("UPDATE " + schemaName + ".reviews r SET author_account_id = a.id "
            + "FROM public.accounts a WHERE r.author_account_id IS NULL AND r.author_auth0_sub = a.auth_subject");
        Integer unmappedAppointments = publicJdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + schemaName
            + ".appointments WHERE client_auth0_sub IS NOT NULL AND client_account_id IS NULL", Integer.class);
        Integer unmappedReviews = publicJdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + schemaName
            + ".reviews WHERE author_auth0_sub IS NOT NULL AND author_account_id IS NULL", Integer.class);
        int unmapped = (unmappedAppointments == null ? 0 : unmappedAppointments)
            + (unmappedReviews == null ? 0 : unmappedReviews);
        if (unmapped > 0) {
            log.warn("IDENTITY BACKFILL: {} appointment(s)/review(s) in schema {} have no matching account",
                unmapped, schemaName);
        }
        return unmapped;
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
                client_auth0_sub VARCHAR(255),
                client_account_id BIGINT,
                notes            VARCHAR(500)
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

        publicJdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS %s.reviews (
                id               BIGSERIAL     PRIMARY KEY,
                author_name      VARCHAR(100)  NOT NULL,
                author_auth0_sub VARCHAR(255),
                author_account_id BIGINT,
                rating           INT           NOT NULL,
                comment          VARCHAR(1000),
                created_at       TIMESTAMP     NOT NULL
            )""".formatted(schemaName));

        // Seed Mon–Sun with 09:00–17:00 open by default
        for (int day = 0; day <= 6; day++) {
            publicJdbcTemplate.update(
                "INSERT INTO " + schemaName + ".operating_hours (tenant_id, day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)",
                tenantId, day, "09:00", "17:00", false
            );
        }
    }

    private static String safeSchema(String schemaName) {
        if (schemaName == null || !TENANT_SCHEMA.matcher(schemaName).matches()) {
            throw new IllegalArgumentException("Not a tenant schema name: " + schemaName);
        }
        return schemaName;
    }

    /** Booking and review counts and the latest booking or review time of one shop. Zeros when its schema is unreadable. */
    public ShopStatistics statisticsOf(String schemaName) {
        String schema = safeSchema(schemaName);
        try {
            return publicJdbcTemplate.queryForObject("SELECT (SELECT count(*) FROM " + schema + ".appointments), "
                + "(SELECT count(*) FROM " + schema + ".reviews), "
                + "GREATEST((SELECT max(start_time) FROM " + schema + ".appointments), "
                + "(SELECT max(created_at) FROM " + schema + ".reviews))", (rs, row) -> {
                    Timestamp last = rs.getTimestamp(3);
                    return new ShopStatistics(rs.getInt(1), rs.getInt(2), last == null ? null : last.toLocalDateTime());
                });
        } catch (org.springframework.dao.DataAccessException exception) {
            log.warn("Could not read statistics of schema {}: {}", schema, exception.getMessage());
            return new ShopStatistics(0, 0, null);
        }
    }

    /** One row per distinct client of a shop: per account when the booking has one, else per phone and name. */
    public List<ClientRow> clientsOf(String schemaName) {
        String schema = safeSchema(schemaName);
        try {
            return publicJdbcTemplate.query("SELECT client_account_id, max(client_name), max(client_phone), count(*), "
                + "max(start_time) FROM " + schema + ".appointments GROUP BY client_account_id, "
                + "CASE WHEN client_account_id IS NULL THEN client_phone END, "
                + "CASE WHEN client_account_id IS NULL THEN lower(client_name) END ORDER BY max(start_time) DESC",
                (rs, row) -> new ClientRow(rs.getObject(1, Long.class), rs.getString(2), rs.getString(3), rs.getInt(4),
                    rs.getTimestamp(5).toLocalDateTime()));
        } catch (org.springframework.dao.DataAccessException exception) {
            log.warn("Could not read clients of schema {}: {}", schema, exception.getMessage());
            return List.of();
        }
    }

    public Map<Long, Integer> reviewCountsByAccount(String schemaName) {
        String schema = safeSchema(schemaName);
        Map<Long, Integer> counts = new HashMap<>();
        try {
            publicJdbcTemplate.query("SELECT author_account_id, count(*) FROM " + schema
                + ".reviews WHERE author_account_id IS NOT NULL GROUP BY author_account_id",
                rs -> { counts.put(rs.getLong(1), rs.getInt(2)); });
        } catch (org.springframework.dao.DataAccessException exception) {
            log.warn("Could not read reviews of schema {}: {}", schema, exception.getMessage());
        }
        return counts;
    }

    /** Detaches a deleted account from the bookings and reviews it left in a shop; the rows themselves stay. */
    public int unlinkAccount(String schemaName, Long accountId, String subject) {
        String schema = safeSchema(schemaName);
        int appointments = publicJdbcTemplate.update("UPDATE " + schema + ".appointments SET client_account_id = NULL, "
            + "client_auth0_sub = NULL WHERE client_account_id = ? OR client_auth0_sub = ?", accountId, subject);
        int reviews = publicJdbcTemplate.update("UPDATE " + schema + ".reviews SET author_account_id = NULL, "
            + "author_auth0_sub = NULL WHERE author_account_id = ? OR author_auth0_sub = ?", accountId, subject);
        return appointments + reviews;
    }

    /** Permanently removes a shop's schema with every table and row in it. */
    public void dropSchema(String schemaName) {
        publicJdbcTemplate.execute("DROP SCHEMA IF EXISTS " + safeSchema(schemaName) + " CASCADE");
    }
}
