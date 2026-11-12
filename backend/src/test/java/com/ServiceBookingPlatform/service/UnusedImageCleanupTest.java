package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.dto.UnusedImageReport;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.exception.UploadsNotConfiguredException;
import com.ServiceBookingPlatform.multitenancy.TenantRoutingDataSource;
import com.ServiceBookingPlatform.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UnusedImageCleanupTest {

    private static final String BASE = "https://img.example.com/dev/tenants/";
    private static final String USED_LOGO = BASE + "1/11111111-1111-1111-1111-111111111111.webp";
    private static final String USED_GALLERY = BASE + "1/22222222-2222-2222-2222-222222222222.webp";
    private static final String UNUSED_OLD = BASE + "1/33333333-3333-3333-3333-333333333333.webp";
    private static final String UNUSED_RECENT = BASE + "1/44444444-4444-4444-4444-444444444444.webp";
    private static final String OTHER_SHOP_UNUSED = BASE + "2/55555555-5555-5555-5555-555555555555.webp";

    private static final Instant LONG_AGO = Instant.now().minus(Duration.ofDays(2));
    private static final Instant JUST_NOW = Instant.now().minus(Duration.ofMinutes(5));

    private TenantRepository repository;
    private ImageUploadService imageUploadService;
    private TenantService service;

    @BeforeEach
    void setUp() {
        repository = mock(TenantRepository.class);
        imageUploadService = mock(ImageUploadService.class);
        service = new TenantService(repository, mock(TenantRoutingDataSource.class),
                mock(SchemaProvisioningService.class), imageUploadService);
        when(imageUploadService.isConfigured()).thenReturn(true);
        TenantEntity shopOne = TenantEntity.builder().id(1L).name("One").logoUrl(USED_LOGO).galleryUrls(USED_GALLERY).build();
        TenantEntity shopTwo = TenantEntity.builder().id(2L).name("Two").build();
        when(repository.findAll()).thenReturn(List.of(shopOne, shopTwo));
        when(imageUploadService.listStoredImages(1L)).thenReturn(List.of(
                new ImageUploadService.StoredImage(USED_LOGO, LONG_AGO),
                new ImageUploadService.StoredImage(USED_GALLERY, LONG_AGO),
                new ImageUploadService.StoredImage(UNUSED_OLD, LONG_AGO),
                new ImageUploadService.StoredImage(UNUSED_RECENT, JUST_NOW)));
        when(imageUploadService.listStoredImages(2L)).thenReturn(List.of(
                new ImageUploadService.StoredImage(OTHER_SHOP_UNUSED, LONG_AGO)));
    }

    @Test
    void aDryRunReportsTheUnusedOldFilesAndDeletesNothing() {
        UnusedImageReport report = service.removeUnusedImages(true);

        assertTrue(report.isDryRun());
        assertEquals(2, report.getTenantsScanned());
        assertEquals(List.of(UNUSED_OLD, OTHER_SHOP_UNUSED), report.getUnusedFiles());
        assertEquals(1, report.getSkippedBecauseRecent());
        assertEquals(0, report.getDeleted());
        verify(imageUploadService, never()).deleteOwnedImages(any(), anyCollection());
    }

    @Test
    void aRealRunDeletesOnlyUnusedOldFilesInTheirOwnShopsFolder() {
        UnusedImageReport report = service.removeUnusedImages(false);

        assertEquals(2, report.getDeleted());
        ArgumentCaptor<Collection<String>> shopOne = ArgumentCaptor.forClass(Collection.class);
        verify(imageUploadService).deleteOwnedImages(eq(1L), shopOne.capture());
        assertEquals(List.of(UNUSED_OLD), List.copyOf(shopOne.getValue()));
        ArgumentCaptor<Collection<String>> shopTwo = ArgumentCaptor.forClass(Collection.class);
        verify(imageUploadService).deleteOwnedImages(eq(2L), shopTwo.capture());
        assertEquals(List.of(OTHER_SHOP_UNUSED), List.copyOf(shopTwo.getValue()));
    }

    @Test
    void aFileUsedByTheLogoOrTheGalleryIsNeverDeleted() {
        service.removeUnusedImages(false);

        ArgumentCaptor<Collection<String>> captor = ArgumentCaptor.forClass(Collection.class);
        verify(imageUploadService, org.mockito.Mockito.times(2)).deleteOwnedImages(any(), captor.capture());
        captor.getAllValues().forEach(urls -> {
            assertTrue(!urls.contains(USED_LOGO));
            assertTrue(!urls.contains(USED_GALLERY));
            assertTrue(!urls.contains(UNUSED_RECENT));
        });
    }

    @Test
    void withoutStorageConfiguredNothingIsScanned() {
        when(imageUploadService.isConfigured()).thenReturn(false);

        assertThrows(UploadsNotConfiguredException.class, () -> service.removeUnusedImages(false));
        verify(repository, never()).findAll();
    }
}
