package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.config.OwnerGuard;
import com.ServiceBookingPlatform.dto.ServiceRequest;
import com.ServiceBookingPlatform.entity.ServiceEntity;
import com.ServiceBookingPlatform.service.ServiceCatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceCatalogService serviceCatalogService;
    private final OwnerGuard ownerGuard;

    @GetMapping
    public ResponseEntity<List<ServiceEntity>> getAll() {
        return ResponseEntity.ok(serviceCatalogService.getAllServices());
    }

    @PostMapping
    public ResponseEntity<ServiceEntity> create(@Valid @RequestBody ServiceRequest request,
                                                 AuthenticatedUser user) {
        ownerGuard.assertOwnsCurrentTenant(user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceCatalogService.createService(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceEntity> update(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequest request,
            AuthenticatedUser user) {
        ownerGuard.assertOwnsCurrentTenant(user);
        return ResponseEntity.ok(serviceCatalogService.updateService(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, AuthenticatedUser user) {
        ownerGuard.assertOwnsCurrentTenant(user);
        serviceCatalogService.deleteService(id);
        return ResponseEntity.noContent().build();
    }
}
