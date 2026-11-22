package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.exception.TenantNotFoundException;
import com.ServiceBookingPlatform.multitenancy.TenantRoutingDataSource;
import com.ServiceBookingPlatform.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TenantDeletionTest {

    private TenantRepository repository;
    private TenantRoutingDataSource routing;
    private SchemaProvisioningService schemas;
    private ImageUploadService images;
    private TenantService service;

    @BeforeEach
    void setUp() {
        repository = mock(TenantRepository.class);
        routing = mock(TenantRoutingDataSource.class);
        schemas = mock(SchemaProvisioningService.class);
        images = mock(ImageUploadService.class);
        service = new TenantService(repository, routing, schemas, images);
    }

    private static TenantEntity shop(long id) {
        return TenantEntity.builder().id(id).slug("shop-" + id).schemaName("tenant_" + id)
                .ownerAuth0Id("local|" + id).ownerAccountId(id).build();
    }

    @Test
    void deletingAShopRemovesPhotosPoolRecordAndSchemaInThatOrderAndReportsPhotos() {
        when(repository.findById(5L)).thenReturn(Optional.of(shop(5)));
        when(images.deleteAllImagesOf(5L)).thenReturn(4);

        int photos = service.deleteTenant(5L);

        assertEquals(4, photos);
        InOrder order = inOrder(images, routing, repository, schemas);
        order.verify(images).deleteAllImagesOf(5L);
        order.verify(routing).removeTenantDataSource("tenant_5");
        order.verify(repository).delete(shop(5));
        order.verify(schemas).dropSchema("tenant_5");
    }

    @Test
    void aSchemaThatFailsToDropNeverUndoesOrHidesTheDeletedRecord() {
        when(repository.findById(5L)).thenReturn(Optional.of(shop(5)));
        doThrow(new IllegalStateException("db busy")).when(schemas).dropSchema("tenant_5");

        service.deleteTenant(5L);

        verify(repository).delete(shop(5));
    }

    @Test
    void deletingAShopThatDoesNotExistChangesNothing() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(TenantNotFoundException.class, () -> service.deleteTenant(99L));

        verify(images, never()).deleteAllImagesOf(anyLong());
        verify(schemas, never()).dropSchema(anyString());
        verify(repository, never()).delete(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void detachingADeletedAccountVisitsEveryShopAndSurvivesABrokenSchema() {
        when(repository.findAll()).thenReturn(List.of(shop(1), shop(2), shop(3)));
        when(schemas.unlinkAccount("tenant_1", 9L, "local|9")).thenReturn(2);
        when(schemas.unlinkAccount("tenant_2", 9L, "local|9"))
                .thenThrow(new org.springframework.jdbc.BadSqlGrammarException("x", "y", new java.sql.SQLException("no schema")));
        when(schemas.unlinkAccount("tenant_3", 9L, "local|9")).thenReturn(1);

        assertEquals(3, service.unlinkAccountEverywhere(9L, "local|9"));
    }

    @Test
    void theShopOwnedByAnAccountIsFoundByAccountIdOrByTheOldSubjectOfAnUnmigratedShop() {
        TenantEntity legacy = TenantEntity.builder().id(8L).ownerAuth0Id("local|9").ownerAccountId(null).build();
        when(repository.findByOwnerAccountId(9L)).thenReturn(Optional.empty());
        when(repository.findByOwnerAuth0Id("local|9")).thenReturn(Optional.of(legacy));

        assertEquals(Optional.of(legacy), service.findShopOwnedBy(9L, "local|9"));
    }
}
