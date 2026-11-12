package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.exception.TenantNotFoundException;
import com.ServiceBookingPlatform.multitenancy.TenantRoutingDataSource;
import com.ServiceBookingPlatform.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    private static AuthenticatedUser user(String subject, Long accountId) {
        return new AuthenticatedUser(subject, null, null, "business", null, accountId);
    }

    private static TenantEntity shop(Long ownerAccountId, String ownerSubject) {
        return TenantEntity.builder().id(1L).ownerAccountId(ownerAccountId).ownerAuth0Id(ownerSubject).build();
    }

    @Test
    void aShopWithAnOwnerAccountIsOwnedByThatAccountOnly() {
        when(repository.findById(1L)).thenReturn(Optional.of(shop(7L, "local|7")));

        assertTrue(service.isOwner(1L, user("local|7", 7L)));
        assertFalse(service.isOwner(1L, user("local|8", 8L)));
        assertFalse(service.isOwner(1L, null));
    }

    @Test
    void onceAShopHasAnOwnerAccountTheOldSubjectAloneNoLongerGrantsAccess() {
        when(repository.findById(1L)).thenReturn(Optional.of(shop(7L, "local|7")));

        assertFalse(service.isOwner(1L, user("local|7", 99L)), "same subject but another account id");
        assertFalse(service.isOwner(1L, user("local|7", null)), "subject that resolves to no account");
    }

    @Test
    void aShopFromBeforeAccountIdsFallsBackToTheOldSubject() {
        when(repository.findById(1L)).thenReturn(Optional.of(shop(null, "dev|owner1")));

        assertTrue(service.isOwner(1L, user("dev|owner1", null)));
        assertTrue(service.isOwner(1L, user("dev|owner1", 5L)));
        assertFalse(service.isOwner(1L, user("dev|other", 5L)));
        assertFalse(service.isOwner(1L, user(null, null)));
    }

    @Test
    void aMissingTenantIsOwnedByNobody() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertFalse(service.isOwner(99L, user("local|7", 7L)));
    }

    @Test
    void theOwnersShopIsFoundByAccountId() {
        TenantEntity mine = shop(7L, "local|7");
        when(repository.findByOwnerAccountId(7L)).thenReturn(Optional.of(mine));

        assertEquals(mine, service.getTenantByOwner(user("local|7", 7L)));
    }

    @Test
    void anOldShopWithoutAnOwnerAccountIsFoundByTheOldSubject() {
        TenantEntity old = shop(null, "dev|owner1");
        when(repository.findByOwnerAccountId(5L)).thenReturn(Optional.empty());
        when(repository.findByOwnerAuth0Id("dev|owner1")).thenReturn(Optional.of(old));

        assertEquals(old, service.getTenantByOwner(user("dev|owner1", 5L)));
        assertEquals(old, service.getTenantByOwner(user("dev|owner1", null)));
    }

    @Test
    void aShopOwnedByAnotherAccountIsNeverReturnedThroughTheOldSubject() {
        when(repository.findByOwnerAccountId(99L)).thenReturn(Optional.empty());
        when(repository.findByOwnerAuth0Id("local|7")).thenReturn(Optional.of(shop(7L, "local|7")));

        assertThrows(TenantNotFoundException.class, () -> service.getTenantByOwner(user("local|7", 99L)));
    }

    @Test
    void anAccountWithoutAShopGetsNotFound() {
        when(repository.findByOwnerAccountId(9L)).thenReturn(Optional.empty());
        when(repository.findByOwnerAuth0Id("local|9")).thenReturn(Optional.empty());

        assertThrows(TenantNotFoundException.class, () -> service.getTenantByOwner(user("local|9", 9L)));
    }
}
