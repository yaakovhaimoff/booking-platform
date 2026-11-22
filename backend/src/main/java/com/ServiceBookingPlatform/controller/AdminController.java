package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.config.AdminGuard;
import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.dto.AdminAccountResponse;
import com.ServiceBookingPlatform.dto.AdminAuditResponse;
import com.ServiceBookingPlatform.dto.AdminClientResponse;
import com.ServiceBookingPlatform.dto.AdminSummaryResponse;
import com.ServiceBookingPlatform.dto.AdminTenantResponse;
import com.ServiceBookingPlatform.dto.DeleteConfirmationRequest;
import com.ServiceBookingPlatform.dto.EnabledRequest;
import com.ServiceBookingPlatform.dto.UnusedImageReport;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.service.AdminService;
import com.ServiceBookingPlatform.service.TenantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final TenantService tenantService;
    private final AdminService adminService;
    private final AdminGuard adminGuard;

    public AdminController(TenantService tenantService, AdminService adminService, AdminGuard adminGuard) {
        this.tenantService = tenantService;
        this.adminService = adminService;
        this.adminGuard = adminGuard;
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminSummaryResponse> summary(AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        return ResponseEntity.ok(adminService.summary());
    }

    @GetMapping("/tenants")
    public ResponseEntity<List<AdminTenantResponse>> listAllTenants(AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        return ResponseEntity.ok(adminService.listShops());
    }

    @PatchMapping("/tenants/{id}/enabled")
    public ResponseEntity<AdminTenantResponse> setEnabled(
            @PathVariable Long id,
            @RequestBody EnabledRequest request,
            AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        TenantEntity updated = adminService.setShopEnabled(user, id, request.isEnabled());
        return ResponseEntity.ok(AdminTenantResponse.from(updated));
    }

    @DeleteMapping("/tenants/{id}")
    public ResponseEntity<Void> deleteTenant(
            @PathVariable Long id,
            @RequestBody DeleteConfirmationRequest request,
            AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        adminService.deleteShop(user, id, request.getConfirmation());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/accounts")
    public ResponseEntity<List<AdminAccountResponse>> listAccounts(AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        return ResponseEntity.ok(adminService.listAccounts());
    }

    @DeleteMapping("/accounts/{id}")
    public ResponseEntity<Void> deleteAccount(
            @PathVariable Long id,
            @RequestBody DeleteConfirmationRequest request,
            AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        adminService.deleteAccount(user, id, request.getConfirmation());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/clients")
    public ResponseEntity<List<AdminClientResponse>> listClients(AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        return ResponseEntity.ok(adminService.listClients());
    }

    @GetMapping("/audit-log")
    public ResponseEntity<List<AdminAuditResponse>> auditLog(AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        return ResponseEntity.ok(adminService.auditLog());
    }

    @PostMapping("/images/cleanup")
    public ResponseEntity<UnusedImageReport> cleanUpUnusedImages(
            @RequestParam(defaultValue = "true") boolean dryRun,
            AuthenticatedUser user) {
        adminGuard.assertAdmin(user);
        return ResponseEntity.ok(tenantService.removeUnusedImages(dryRun));
    }
}
