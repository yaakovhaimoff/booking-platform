package com.ServiceBookingPlatform.service;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class SchemaNameSafetyTest {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final SchemaProvisioningService service = new SchemaProvisioningService(jdbcTemplate);

    @Test
    void onlyTenantSchemasCanBeDroppedOrReadSoNoOtherSchemaOrSqlIsReachable() {
        for (String name : new String[]{"public", "tenant_1; DROP SCHEMA public CASCADE", "tenant_", "tenant_x", null, "pg_catalog"}) {
            assertThrows(IllegalArgumentException.class, () -> service.dropSchema(name));
            assertThrows(IllegalArgumentException.class, () -> service.statisticsOf(name));
            assertThrows(IllegalArgumentException.class, () -> service.clientsOf(name));
            assertThrows(IllegalArgumentException.class, () -> service.unlinkAccount(name, 1L, "local|1"));
        }
        verify(jdbcTemplate, never()).execute(anyString());
    }

    @Test
    void aTenantSchemaIsDroppedWithCascade() {
        service.dropSchema("tenant_42");

        verify(jdbcTemplate).execute("DROP SCHEMA IF EXISTS tenant_42 CASCADE");
    }
}
