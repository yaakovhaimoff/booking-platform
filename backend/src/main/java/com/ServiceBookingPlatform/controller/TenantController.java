package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.dto.PublicTenantResponse;
import com.ServiceBookingPlatform.dto.TenantProfileRequest;
import com.ServiceBookingPlatform.dto.TenantRequest;
import com.ServiceBookingPlatform.dto.TenantResponse;
import com.ServiceBookingPlatform.dto.UploadRequest;
import com.ServiceBookingPlatform.dto.UploadResponse;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.exception.ForbiddenException;
import com.ServiceBookingPlatform.service.ImageUploadService;
import com.ServiceBookingPlatform.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/tenants")
public class TenantController {

    private final TenantService tenantService;
    private final ImageUploadService imageUploadService;

    public TenantController(TenantService tenantService, ImageUploadService imageUploadService) {
        this.tenantService = tenantService;
        this.imageUploadService = imageUploadService;
    }

    // GET /api/v1/tenants/{slug}
    // Public endpoint. Frontend calls this on every /store/:slug load to get the tenant ID.
    @GetMapping("/{slug}")
    public ResponseEntity<PublicTenantResponse> getBySlug(@PathVariable String slug) {
        TenantEntity tenant = tenantService.getTenantBySlug(slug);
        return ResponseEntity.ok(PublicTenantResponse.from(tenant));
    }

    @GetMapping("/me")
    public ResponseEntity<TenantResponse> getMyTenant(AuthenticatedUser user) {
        TenantEntity tenant = tenantService.getTenantByOwnerAuth0Id(user.subject());
        return ResponseEntity.ok(TenantResponse.from(tenant));
    }

    @PutMapping("/me")
    public ResponseEntity<TenantResponse> updateMyTenant(
            @Valid @RequestBody TenantProfileRequest request,
            AuthenticatedUser user) {
        return ResponseEntity.ok(TenantResponse.from(tenantService.updateProfile(user.subject(), request)));
    }

    @PostMapping("/me/uploads")
    public ResponseEntity<UploadResponse> createUpload(
            @Valid @RequestBody UploadRequest request,
            AuthenticatedUser user) {
        TenantEntity tenant = tenantService.getTenantByOwnerAuth0Id(user.subject());
        return ResponseEntity.ok(imageUploadService.createUpload(
                tenant.getId(), request.getContentType(), request.getSizeBytes()));
    }

    @PostMapping
    public ResponseEntity<TenantResponse> createTenant(
            @Valid @RequestBody TenantRequest request,
            AuthenticatedUser user) {
        if (!user.isBusiness()) {
            throw new ForbiddenException("Only business accounts can create a store");
        }
        TenantEntity tenant = tenantService.onboardTenant(
                request.getSlug(), request.getName(), user.subject(), user.email());
        return ResponseEntity.status(HttpStatus.CREATED).body(TenantResponse.from(tenant));
    }

    @GetMapping
    public ResponseEntity<List<PublicTenantResponse>> listTenants() {
        return ResponseEntity.ok(
            tenantService.listEnabledTenants().stream()
                .map(PublicTenantResponse::from)
                .collect(Collectors.toList())
        );
    }
}
