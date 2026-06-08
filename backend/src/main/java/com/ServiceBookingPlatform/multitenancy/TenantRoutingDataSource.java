package com.ServiceBookingPlatform.multitenancy;

import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class TenantRoutingDataSource extends AbstractRoutingDataSource {

    // Stores the live DataSource map (schema name → HikariCP DataSource).
    // Using a separate map so we can add entries at runtime (afterPropertiesSet re-resolves from it).
    private final Map<Object, Object> tenantDataSources = new ConcurrentHashMap<>();

    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContextHolder.getCurrentSchema();
    }

    // Called by DataSourceConfig at startup and by TenantService when a new tenant is onboarded.
    // Adds the DataSource to the live map and refreshes the AbstractRoutingDataSource resolution cache.
    public void addTenantDataSource(String schemaName, DataSource dataSource) {
        tenantDataSources.put(schemaName, dataSource);
        setTargetDataSources(new HashMap<>(tenantDataSources));
        afterPropertiesSet();
    }
}
