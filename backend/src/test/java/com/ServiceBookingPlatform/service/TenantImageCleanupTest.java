package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.dto.TenantProfileRequest;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.multitenancy.TenantRoutingDataSource;
import com.ServiceBookingPlatform.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TenantImageCleanupTest {

    private static final String BASE = "https://img.example.com/tenants/1/";
    private static final String LOGO = BASE + "11111111-1111-1111-1111-111111111111.webp";
    private static final String COVER = BASE + "22222222-2222-2222-2222-222222222222.webp";
    private static final String GALLERY_ONE = BASE + "33333333-3333-3333-3333-333333333333.jpg";
    private static final String GALLERY_TWO = BASE + "44444444-4444-4444-4444-444444444444.png";

    private TenantRepository repository;
    private ImageUploadService imageUploadService;
    private TenantService service;
    private TenantEntity shop;
    private final AuthenticatedUser owner = new AuthenticatedUser("local|7", null, null, "business", null, 7L);

    @BeforeEach
    void setUp() {
        repository = mock(TenantRepository.class);
        imageUploadService = mock(ImageUploadService.class);
        service = new TenantService(repository, mock(TenantRoutingDataSource.class),
                mock(SchemaProvisioningService.class), imageUploadService);
        shop = TenantEntity.builder().id(1L).ownerAccountId(7L).ownerAuth0Id("local|7")
                .name("Shop").logoUrl(LOGO).coverUrl(COVER).galleryUrls(GALLERY_ONE + "\n" + GALLERY_TWO).build();
        when(repository.findByOwnerAccountId(7L)).thenReturn(Optional.of(shop));
        when(repository.save(any(TenantEntity.class))).thenAnswer(call -> call.getArgument(0));
    }

    private static TenantProfileRequest request(String logo, String cover, List<String> gallery) {
        TenantProfileRequest request = new TenantProfileRequest();
        request.setName("Shop");
        request.setLogoUrl(logo);
        request.setCoverUrl(cover);
        request.setGalleryUrls(gallery);
        return request;
    }

    @SuppressWarnings("unchecked")
    private Set<String> deleted() {
        ArgumentCaptor<Collection<String>> captor = ArgumentCaptor.forClass(Collection.class);
        verify(imageUploadService).deleteOwnedImages(eq(1L), captor.capture());
        return Set.copyOf(captor.getValue());
    }

    @Test
    void aRemovedGalleryImageIsDeletedFromStorage() {
        service.updateProfile(owner, request(LOGO, COVER, List.of(GALLERY_ONE)));

        assertEquals(Set.of(GALLERY_TWO), deleted());
    }

    @Test
    void aRemovedLogoAndCoverAreDeleted() {
        service.updateProfile(owner, request("", null, List.of(GALLERY_ONE, GALLERY_TWO)));

        assertEquals(Set.of(LOGO, COVER), deleted());
    }

    @Test
    void aReplacedLogoDeletesTheOldOneOnly() {
        String replacement = BASE + "55555555-5555-5555-5555-555555555555.webp";

        service.updateProfile(owner, request(replacement, COVER, List.of(GALLERY_ONE, GALLERY_TWO)));

        assertEquals(Set.of(LOGO), deleted());
    }

    @Test
    void aFileStillUsedElsewhereInTheProfileIsKept() {
        service.updateProfile(owner, request(GALLERY_ONE, COVER, List.of(GALLERY_ONE, GALLERY_TWO)));

        assertEquals(Set.of(LOGO), deleted());
    }

    @Test
    void savingWithoutRemovingAnythingDeletesNothing() {
        service.updateProfile(owner, request(LOGO, COVER, List.of(GALLERY_ONE, GALLERY_TWO)));

        verify(imageUploadService, never()).deleteOwnedImages(any(), anyCollection());
    }

    @Test
    void aRequestWithoutAGalleryLeavesTheGalleryAndItsFilesAlone() {
        service.updateProfile(owner, request(LOGO, COVER, null));

        verify(imageUploadService, never()).deleteOwnedImages(any(), anyCollection());
    }
}
