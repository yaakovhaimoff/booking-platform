package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.DataSourceConfig;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.exception.SlugAlreadyTakenException;
import com.ServiceBookingPlatform.exception.TenantDisabledException;
import com.ServiceBookingPlatform.exception.TenantNotFoundException;
import com.ServiceBookingPlatform.multitenancy.TenantRoutingDataSource;
import com.ServiceBookingPlatform.repository.TenantRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class TenantService {

    private final TenantRepository tenantRepository;
    private final TenantRoutingDataSource tenantRoutingDataSource;
    private final SchemaProvisioningService schemaProvisioningService;

    // spring.datasource.url / username / password — injected from application.properties
    // Used to create per-tenant HikariCP DataSource instances
    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    public TenantService(TenantRepository tenantRepository,
                         TenantRoutingDataSource tenantRoutingDataSource,
                         SchemaProvisioningService schemaProvisioningService) {
        this.tenantRepository = tenantRepository;
        this.tenantRoutingDataSource = tenantRoutingDataSource;
        this.schemaProvisioningService = schemaProvisioningService;
    }

    // On startup: load all existing tenants and register their DataSources.
    // This ensures tenants created before the last restart can still be routed to.
    @PostConstruct
    public void initTenantDataSources() {
        tenantRepository.findAll().forEach(tenant -> {
            log.info("Migrating schema: {} (tenant {})", tenant.getSchemaName(), tenant.getId());
            schemaProvisioningService.migrate(tenant.getSchemaName(), tenant.getId());
            DataSource ds = DataSourceConfig.createTenantDataSource(
                    jdbcUrl, dbUsername, dbPassword, tenant.getSchemaName());
            tenantRoutingDataSource.addTenantDataSource(tenant.getSchemaName(), ds);
            log.info("Registered datasource for schema: {}", tenant.getSchemaName());
        });
    }

    public TenantEntity getTenantBySlug(String slug) {
        TenantEntity tenant = tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new TenantNotFoundException(slug));
        if (!tenant.isEnabled()) {
            throw new TenantDisabledException(slug);
        }
        return tenant;
    }

    public List<TenantEntity> listAllTenants() {
        return tenantRepository.findAll();
    }

    @Transactional
    public TenantEntity setTenantEnabled(Long id, boolean enabled) {
        TenantEntity tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new TenantNotFoundException(String.valueOf(id)));
        tenant.setEnabled(enabled);
        return tenantRepository.save(tenant);
    }

    public TenantEntity getTenantByOwnerAuth0Id(String auth0Id) {
        return tenantRepository.findByOwnerAuth0Id(auth0Id)
                .orElseThrow(() -> new TenantNotFoundException(auth0Id));
    }

    // Registers a new business:
    // 1. Validates slug format (regex: ^[a-z0-9-]{3,50}$)
    // 2. Checks slug uniqueness
    // 3. Saves tenant row to public.tenants
    // 4. Provisions the schema + tables via SchemaProvisioningService
    // 5. Registers the new DataSource in TenantRoutingDataSource
    // 6. Returns the saved TenantEntity
    @Transactional
    public TenantEntity onboardTenant(String slug, String name, String ownerAuth0Id, String ownerEmail) {
        if (!slug.matches("^[a-z0-9-]{3,50}$")) {
            throw new IllegalArgumentException("Invalid slug format");
        }
        if (tenantRepository.existsBySlug(slug)) {
            throw new SlugAlreadyTakenException(slug);
        }
        if (tenantRepository.findByOwnerAuth0Id(ownerAuth0Id).isPresent()) {
            throw new IllegalStateException("Owner already has a registered tenant");
        }

        String schemaName = "tenant_" + System.currentTimeMillis(); // temp placeholder until saved
        TenantEntity tenant = TenantEntity.builder()
                .slug(slug)
                .name(name)
                .schemaName("pending")  // will be updated after save gives us the ID
                .ownerAuth0Id(ownerAuth0Id)
                .ownerEmail(ownerEmail)
                .createdAt(LocalDateTime.now())
                .build();
        tenant = tenantRepository.save(tenant);

        schemaName = "tenant_" + tenant.getId();
        tenant.setSchemaName(schemaName);
        tenant = tenantRepository.save(tenant);

        schemaProvisioningService.provision(schemaName, tenant.getId());

        DataSource ds = DataSourceConfig.createTenantDataSource(
                jdbcUrl, dbUsername, dbPassword, schemaName);
        tenantRoutingDataSource.addTenantDataSource(schemaName, ds);

        log.info("Tenant onboarded: id={} slug={} schema={}", tenant.getId(), tenant.getSlug(), schemaName);
        return tenant;
    }
}
