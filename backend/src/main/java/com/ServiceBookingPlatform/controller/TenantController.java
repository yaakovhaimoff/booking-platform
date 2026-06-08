package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.dto.TenantRequest;
import com.ServiceBookingPlatform.dto.TenantResponse;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.*;

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

    // POST /api/v1/tenants
    // Requires a valid Auth0 JWT. Extracts the owner's Auth0 user ID from the JWT sub claim.
    @PostMapping
    public ResponseEntity<TenantResponse> createTenant(
            @Valid @RequestBody TenantRequest request,
            JwtAuthenticationToken authentication) {
        String ownerAuth0Id = authentication.getToken().getSubject();
        TenantEntity tenant = tenantService.onboardTenant(request.getSlug(), ownerAuth0Id);
        return ResponseEntity.status(HttpStatus.CREATED).body(TenantResponse.from(tenant));
    }
}
