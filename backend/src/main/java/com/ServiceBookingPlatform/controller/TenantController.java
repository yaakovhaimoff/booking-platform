package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.dto.PublicTenantResponse;
import com.ServiceBookingPlatform.dto.TenantProfileRequest;
import com.ServiceBookingPlatform.dto.TenantRequest;
import com.ServiceBookingPlatform.dto.TenantResponse;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
// DEV MODE: JwtAuthenticationToken removed; identity passed via X-Dev-User-Sub / X-Dev-User-Email headers.
// To re-enable: restore the JwtAuthenticationToken import and swap @RequestHeader params back.
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/tenants")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    // GET /api/v1/tenants/{slug}
    // Public endpoint. Frontend calls this on every /store/:slug load to get the tenant ID.
    @GetMapping("/{slug}")
    public ResponseEntity<TenantResponse> getBySlug(@PathVariable String slug) {
        TenantEntity tenant = tenantService.getTenantBySlug(slug);
        return ResponseEntity.ok(TenantResponse.from(tenant));
    }

    @GetMapping("/me")
    public ResponseEntity<TenantResponse> getMyTenant(
            @RequestHeader(value = "X-Dev-User-Sub", defaultValue = "dev|owner1") String auth0Id) {
        TenantEntity tenant = tenantService.getTenantByOwnerAuth0Id(auth0Id);
        return ResponseEntity.ok(TenantResponse.from(tenant));
    }

    @PutMapping("/me")
    public ResponseEntity<TenantResponse> updateMyTenant(
            @Valid @RequestBody TenantProfileRequest request,
            @RequestHeader(value = "X-Dev-User-Sub", defaultValue = "dev|owner1") String auth0Id) {
        return ResponseEntity.ok(TenantResponse.from(tenantService.updateProfile(auth0Id, request)));
    }

    @PostMapping
    public ResponseEntity<TenantResponse> createTenant(
            @Valid @RequestBody TenantRequest request,
            @RequestHeader(value = "X-Dev-User-Sub", defaultValue = "dev|owner1") String ownerAuth0Id,
            @RequestHeader(value = "X-Dev-User-Email", defaultValue = "dev@example.com") String ownerEmail) {
        TenantEntity tenant = tenantService.onboardTenant(
                request.getSlug(), request.getName(), ownerAuth0Id, ownerEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(TenantResponse.from(tenant));
    }

    @GetMapping
    public ResponseEntity<List<PublicTenantResponse>> listTenants() {
        return ResponseEntity.ok(
            tenantService.listAllTenants().stream()
                .map(PublicTenantResponse::from)
                .collect(Collectors.toList())
        );
    }
}
