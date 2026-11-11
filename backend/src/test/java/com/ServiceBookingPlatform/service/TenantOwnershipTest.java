package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.multitenancy.TenantRoutingDataSource;
import com.ServiceBookingPlatform.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TenantOwnershipTest {

    private TenantRepository repository;
    private TenantService service;

    @BeforeEach
    void setUp() {
        repository = mock(TenantRepository.class);
        service = new TenantService(repository, mock(TenantRoutingDataSource.class), mock(SchemaProvisioningService.class));
    }

    @Test
    void onlyTheRegisteredOwnerSubjectOwnsTheTenant() {
        when(repository.findById(1L)).thenReturn(Optional.of(TenantEntity.builder().id(1L).ownerAuth0Id("local|7").build()));

        assertTrue(service.isOwner(1L, "local|7"));
        assertFalse(service.isOwner(1L, "local|8"));
        assertFalse(service.isOwner(1L, null));
    }

    @Test
    void aMissingTenantIsOwnedByNobody() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertFalse(service.isOwner(99L, "local|7"));
    }
}
