package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
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
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
public class TenantService {

    private final TenantRepository tenantRepository;
    private final TenantRoutingDataSource tenantRoutingDataSource;
    private final SchemaProvisioningService schemaProvisioningService;
    private final ImageUploadService imageUploadService;

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
                         SchemaProvisioningService schemaProvisioningService,
                         ImageUploadService imageUploadService) {
        this.tenantRepository = tenantRepository;
        this.tenantRoutingDataSource = tenantRoutingDataSource;
        this.schemaProvisioningService = schemaProvisioningService;
        this.imageUploadService = imageUploadService;
    }

    // On startup: load all existing tenants and register their DataSources.
    // This ensures tenants created before the last restart can still be routed to.
    @PostConstruct
    public void initTenantDataSources() {
        schemaProvisioningService.backfillPublicIdentity();
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

    /** Every tenant including disabled ones: for the admin panel only. */
    public List<TenantEntity> listAllTenants() {
        return tenantRepository.findAll();
    }

    /** What customers can search: disabled shops never appear. */
    public List<TenantEntity> listEnabledTenants() {
        return tenantRepository.findByEnabledTrue();
    }

    @Transactional
    public TenantEntity setTenantEnabled(Long id, boolean enabled) {
        TenantEntity tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new TenantNotFoundException(String.valueOf(id)));
        tenant.setEnabled(enabled);
        return tenantRepository.save(tenant);
    }

    @Transactional
    public TenantEntity updateProfile(AuthenticatedUser owner, TenantProfileRequest r) {
        TenantEntity t = getTenantByOwner(owner);
        Set<String> previousImages = imageUrlsOf(t);
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
        TenantEntity saved = tenantRepository.save(t);
        Set<String> removedImages = new LinkedHashSet<>(previousImages);
        removedImages.removeAll(imageUrlsOf(saved));
        deleteImagesAfterCommit(saved.getId(), removedImages);
        return saved;
    }

    private static Set<String> imageUrlsOf(TenantEntity tenant) {
        Set<String> urls = new LinkedHashSet<>();
        if (tenant.getLogoUrl() != null) urls.add(tenant.getLogoUrl());
        if (tenant.getCoverUrl() != null) urls.add(tenant.getCoverUrl());
        if (tenant.getGalleryUrls() != null) {
            for (String url : tenant.getGalleryUrls().split("\n")) {
                if (!url.isBlank()) urls.add(url.trim());
            }
        }
        return urls;
    }

    private void deleteImagesAfterCommit(Long tenantId, Set<String> urls) {
        if (urls.isEmpty()) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    imageUploadService.deleteOwnedImages(tenantId, urls);
                }
            });
        } else {
            imageUploadService.deleteOwnedImages(tenantId, urls);
        }
    }

    private static String blankToNull(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }

    public boolean isOwner(Long tenantId, AuthenticatedUser user) {
        if (user == null) {
            return false;
        }
        return tenantRepository.findById(tenantId)
                .map(tenant -> user.isSameAs(tenant.getOwnerAccountId(), tenant.getOwnerAuth0Id()))
                .orElse(false);
    }

    // By account id; for a shop from before account ids existed (no owner_account_id yet), by the old subject.
    public TenantEntity getTenantByOwner(AuthenticatedUser owner) {
        Optional<TenantEntity> byAccount = owner.accountId() == null ? Optional.empty()
                : tenantRepository.findByOwnerAccountId(owner.accountId());
        return byAccount
                .or(() -> tenantRepository.findByOwnerAuth0Id(owner.subject())
                        .filter(tenant -> tenant.getOwnerAccountId() == null))
                .orElseThrow(() -> new TenantNotFoundException(owner.subject()));
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
    public TenantEntity onboardTenant(String slug, String name, AuthenticatedUser owner, String ownerEmail) {
        slug = generateUniqueSlug(name);
        boolean alreadyOwns = (owner.accountId() != null && tenantRepository.findByOwnerAccountId(owner.accountId()).isPresent())
                || tenantRepository.findByOwnerAuth0Id(owner.subject()).isPresent();
        if (alreadyOwns) {
            throw new IllegalStateException("Owner already has a registered tenant");
        }

        String schemaName = "tenant_" + System.currentTimeMillis(); // temp placeholder until saved
        TenantEntity tenant = TenantEntity.builder()
                .slug(slug)
                .name(name)
                .schemaName("pending")  // will be updated after save gives us the ID
                .ownerAuth0Id(owner.subject())
                .ownerAccountId(owner.accountId())
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
