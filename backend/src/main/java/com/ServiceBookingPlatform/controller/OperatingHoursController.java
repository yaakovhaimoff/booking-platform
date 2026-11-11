package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.config.OwnerGuard;
import com.ServiceBookingPlatform.dto.OperatingHoursRequest;
import com.ServiceBookingPlatform.entity.OperatingHoursEntity;
import com.ServiceBookingPlatform.multitenancy.TenantContextHolder;
import com.ServiceBookingPlatform.service.OperatingHoursService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/operating-hours")
@RequiredArgsConstructor
public class OperatingHoursController {

    private final OperatingHoursService operatingHoursService;
    private final OwnerGuard ownerGuard;

    @GetMapping
    public ResponseEntity<List<OperatingHoursEntity>> getHours() {
        Long tenantId = TenantContextHolder.getTenantId();
        return ResponseEntity.ok(operatingHoursService.getHours(tenantId));
    }

    @PutMapping
    public ResponseEntity<List<OperatingHoursEntity>> updateHours(
            @RequestBody List<OperatingHoursRequest> rows,
            AuthenticatedUser user) {
        ownerGuard.assertOwnsCurrentTenant(user);
        Long tenantId = TenantContextHolder.getTenantId();
        return ResponseEntity.ok(operatingHoursService.updateHours(tenantId, rows));
    }
}
