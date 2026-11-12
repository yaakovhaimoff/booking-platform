package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.config.AdminGuard;
import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.dto.AdminTenantResponse;
import com.ServiceBookingPlatform.dto.EnabledRequest;
import com.ServiceBookingPlatform.dto.UnusedImageReport;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.service.TenantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final TenantService tenantService;
    private final AdminGuard adminGuard;

    public AdminController(TenantService tenantService, AdminGuard adminGuard) {
        this.tenantService = tenantService;
        this.adminGuard = adminGuard;
    }

    @GetMapping("/tenants")
    public ResponseEntity<List<AdminTenantResponse>> listAllTenants(AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        return ResponseEntity.ok(
            tenantService.listAllTenants().stream()
                .map(AdminTenantResponse::from)
                .collect(Collectors.toList())
        );
    }

    @PatchMapping("/tenants/{id}/enabled")
    public ResponseEntity<AdminTenantResponse> setEnabled(
            @PathVariable Long id,
            @RequestBody EnabledRequest request,
            AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        TenantEntity updated = tenantService.setTenantEnabled(id, request.isEnabled());
        return ResponseEntity.ok(AdminTenantResponse.from(updated));
    }

    @PostMapping("/images/cleanup")
    public ResponseEntity<UnusedImageReport> cleanUpUnusedImages(
            @RequestParam(defaultValue = "true") boolean dryRun,
            AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        return ResponseEntity.ok(tenantService.removeUnusedImages(dryRun));
    }
}
