package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.DataSourceConfig;
import com.ServiceBookingPlatform.dto.TenantProfileRequest;
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

    @Transactional
    public TenantEntity updateProfile(String ownerAuth0Id, TenantProfileRequest r) {
        TenantEntity t = getTenantByOwnerAuth0Id(ownerAuth0Id);
        t.setName(r.getName().trim());
        t.setAddress(blankToNull(r.getAddress()));
        t.setPhone(blankToNull(r.getPhone()));
        t.setWhatsappNumber(blankToNull(r.getWhatsappNumber()));
        t.setLogoUrl(blankToNull(r.getLogoUrl()));
        t.setCoverUrl(blankToNull(r.getCoverUrl()));
        t.setDefaultLanguage(blankToNull(r.getDefaultLanguage()));
        t.setCurrency(blankToNull(r.getCurrency()));
        t.setAbout(blankToNull(r.getAbout()));
        if (r.getGalleryUrls() != null) {
            String joined = r.getGalleryUrls().stream().map(String::trim).filter(u -> !u.isEmpty())
                    .collect(java.util.stream.Collectors.joining("\n"));
            t.setGalleryUrls(joined.isEmpty() ? null : joined);
        }
        return tenantRepository.save(t);
    }

    private static String blankToNull(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }

    public TenantEntity getTenantByOwnerAuth0Id(String auth0Id) {
        return tenantRepository.findByOwnerAuth0Id(auth0Id)
                .orElseThrow(() -> new TenantNotFoundException(auth0Id));
    }

    // "Mike's Barbershop" -> "mikes-barbershop-k3x9q2"; retried until unused.
    private String generateUniqueSlug(String name) {
        String base = java.text.Normalizer.normalize(name == null ? "" : name, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (base.length() > 40) base = base.substring(0, 40).replaceAll("-+$", "");
        if (base.isEmpty()) base = "store";
        String alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
        java.security.SecureRandom rnd = new java.security.SecureRandom();
        while (true) {
            StringBuilder sb = new StringBuilder(base).append('-');
            for (int i = 0; i < 6; i++) sb.append(alphabet.charAt(rnd.nextInt(alphabet.length())));
            String candidate = sb.toString();
            if (!tenantRepository.existsBySlug(candidate)) return candidate;
        }
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
        slug = generateUniqueSlug(name);
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
