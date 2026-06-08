package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.entity.ServiceEntity;
import com.ServiceBookingPlatform.service.ServiceCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
public class ServiceController {

    private final ServiceCatalogService serviceCatalogService;

    @GetMapping
    public ResponseEntity<List<ServiceEntity>> getAll() {
        return ResponseEntity.ok(serviceCatalogService.getAllServices());
    }
}
