package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.dto.UploadResponse;
import com.ServiceBookingPlatform.exception.UploadsNotConfiguredException;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ImageUploadServiceTest {

    private static ImageUploadService configured() {
        return new ImageUploadService("acct123", "keyid", "secretsecretsecret", "torni-images", "https://img.example.com/", "dev");
    }

    @Test
    void withoutCredentialsUploadsAreDisabledAndRefused() {
        ImageUploadService service = new ImageUploadService("", "", "", "", "", "");

        assertFalse(service.isConfigured());
        assertThrows(UploadsNotConfiguredException.class, () -> service.createUpload(1L, "image/webp", 1000));
    }

    @Test
    void withoutAnEnvironmentUploadsAreDisabled() {
        ImageUploadService service = new ImageUploadService("acct123", "keyid", "secretsecretsecret", "torni-images", "https://img.example.com/", "");

        assertFalse(service.isConfigured());
        assertThrows(UploadsNotConfiguredException.class, () -> service.createUpload(1L, "image/webp", 1000));
    }

    @Test
    void anEnvironmentThatCouldEscapeTheFolderIsRefusedAtStartup() {
        assertThrows(IllegalStateException.class, () -> new ImageUploadService(
                "acct123", "keyid", "secretsecretsecret", "torni-images", "https://img.example.com/", "../prod"));
    }

    @Test
    void prodFilesLiveUnderTheirOwnPrefix() {
        ImageUploadService service = new ImageUploadService("acct123", "keyid", "secretsecretsecret", "torni-images", "https://img.example.com/", "prod");

        assertTrue(service.createUpload(42L, "image/webp", 1000).getPublicUrl().startsWith("https://img.example.com/prod/tenants/42/"));
    }

    @Test
    void aSignedLinkTargetsTheBucketAndTheTenantsOwnFolder() {
        UploadResponse response = configured().createUpload(42L, "image/webp", 150_000);

        assertTrue(response.getUploadUrl().startsWith("https://acct123.r2.cloudflarestorage.com/torni-images/dev/tenants/42/"),
                response.getUploadUrl());
        assertTrue(response.getUploadUrl().contains("X-Amz-Signature="));
        assertTrue(response.getPublicUrl().startsWith("https://img.example.com/dev/tenants/42/"));
        assertTrue(response.getPublicUrl().endsWith(".webp"));
        assertEquals("image/webp", response.getHeaders().get("content-type"));
        assertFalse(response.getHeaders().containsKey("host"));
        assertFalse(response.getHeaders().containsKey("content-length"));
    }

    @Test
    void theSignedSizeIsPartOfTheSignature() {
        UploadResponse response = configured().createUpload(1L, "image/jpeg", 123);

        assertTrue(response.getUploadUrl().toLowerCase().contains("content-length"), response.getUploadUrl());
    }

    @Test
    void everyLinkGetsANewUnguessableFileName() {
        ImageUploadService service = configured();

        assertFalse(service.createUpload(1L, "image/png", 1000).getPublicUrl()
                .equals(service.createUpload(1L, "image/png", 1000).getPublicUrl()));
    }

    @Test
    void onlyWebpJpegAndPngAreAccepted() {
        ImageUploadService service = configured();

        assertThrows(IllegalArgumentException.class, () -> service.createUpload(1L, "image/svg+xml", 1000));
        assertThrows(IllegalArgumentException.class, () -> service.createUpload(1L, "text/html", 1000));
        assertThrows(IllegalArgumentException.class, () -> service.createUpload(1L, null, 1000));
    }

    @Test
    void emptyOrOversizedFilesAreRefused() {
        ImageUploadService service = configured();

        assertThrows(IllegalArgumentException.class, () -> service.createUpload(1L, "image/webp", 0));
        assertThrows(IllegalArgumentException.class, () -> service.createUpload(1L, "image/webp", 2_000_001));
        service.createUpload(1L, "image/webp", 2_000_000);
    }

    private static final String FILE = "fb6a409a-fe10-479b-9c2e-c987ac6b4596.webp";
    private static final String OTHER_FILE = "8b1b5e07-a170-4ccb-96ff-079594b4775d.jpg";

    private static ImageUploadService withStorage(S3Client storage) {
        return new ImageUploadService("torni-images", "https://img.example.com/", "dev", mock(S3Presigner.class), storage);
    }

    @Test
    void deletesTheShopsOwnFilesFromTheBucket() {
        S3Client storage = mock(S3Client.class);

        withStorage(storage).deleteOwnedImages(16L, List.of(
                "https://img.example.com/dev/tenants/16/" + FILE,
                "https://img.example.com/dev/tenants/16/" + OTHER_FILE));

        ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(storage, times(2)).deleteObject(captor.capture());
        assertEquals("torni-images", captor.getAllValues().get(0).bucket());
        assertEquals("dev/tenants/16/" + FILE, captor.getAllValues().get(0).key());
        assertEquals("dev/tenants/16/" + OTHER_FILE, captor.getAllValues().get(1).key());
    }

    @Test
    void neverDeletesAnotherShopsFileOrAnOutsideLink() {
        S3Client storage = mock(S3Client.class);

        withStorage(storage).deleteOwnedImages(16L, List.of(
                "https://img.example.com/dev/tenants/17/" + FILE,
                "https://elsewhere.example.com/dev/tenants/16/" + FILE,
                "https://images.unsplash.com/photo-1.jpg"));

        verify(storage, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void neverDeletesTheOtherEnvironmentsFileForTheSameTenantId() {
        S3Client storage = mock(S3Client.class);

        withStorage(storage).deleteOwnedImages(16L, List.of(
                "https://img.example.com/prod/tenants/16/" + FILE,
                "https://img.example.com/tenants/16/" + FILE));

        verify(storage, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void refusesFileNamesThatCouldEscapeTheShopsFolder() {
        S3Client storage = mock(S3Client.class);

        withStorage(storage).deleteOwnedImages(16L, List.of(
                "https://img.example.com/dev/tenants/16/../17/" + FILE,
                "https://img.example.com/dev/tenants/16/" + FILE + "?x=1",
                "https://img.example.com/dev/tenants/16/sub/" + FILE,
                "https://img.example.com/dev/tenants/16/notauuid.webp",
                "https://img.example.com/dev/tenants/16/"));

        verify(storage, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void aFailedDeleteIsSwallowedAndTheRestStillRun() {
        S3Client storage = mock(S3Client.class);
        doThrow(new RuntimeException("R2 down")).when(storage).deleteObject(any(DeleteObjectRequest.class));

        withStorage(storage).deleteOwnedImages(16L, List.of(
                "https://img.example.com/dev/tenants/16/" + FILE,
                "https://img.example.com/dev/tenants/16/" + OTHER_FILE));

        verify(storage, times(2)).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void withoutCredentialsDeletingDoesNothing() {
        new ImageUploadService("", "", "", "", "", "")
                .deleteOwnedImages(16L, List.of("https://img.example.com/dev/tenants/16/" + FILE));
    }

    private static S3Object stored(String key, Instant modified) {
        return S3Object.builder().key(key).lastModified(modified).build();
    }

    @Test
    void listsOnlyTheShopsOwnGeneratedFilesInTheCurrentEnvironment() {
        S3Client storage = mock(S3Client.class);
        Instant modified = Instant.parse("2026-01-01T00:00:00Z");
        when(storage.listObjectsV2(any(ListObjectsV2Request.class))).thenReturn(ListObjectsV2Response.builder()
                .contents(stored("dev/tenants/16/" + FILE, modified), stored("dev/tenants/16/notes.txt", modified),
                        stored("dev/tenants/16/sub/" + OTHER_FILE, modified))
                .isTruncated(false).build());

        List<ImageUploadService.StoredImage> images = withStorage(storage).listStoredImages(16L);

        assertEquals(List.of(new ImageUploadService.StoredImage("https://img.example.com/dev/tenants/16/" + FILE, modified)), images);
        ArgumentCaptor<ListObjectsV2Request> captor = ArgumentCaptor.forClass(ListObjectsV2Request.class);
        verify(storage).listObjectsV2(captor.capture());
        assertEquals("dev/tenants/16/", captor.getValue().prefix());
        assertEquals("torni-images", captor.getValue().bucket());
    }

    @Test
    void listingFollowsEveryPageOfResults() {
        S3Client storage = mock(S3Client.class);
        Instant modified = Instant.parse("2026-01-01T00:00:00Z");
        when(storage.listObjectsV2(any(ListObjectsV2Request.class))).thenReturn(
                ListObjectsV2Response.builder().contents(stored("dev/tenants/16/" + FILE, modified))
                        .isTruncated(true).nextContinuationToken("page-2").build(),
                ListObjectsV2Response.builder().contents(stored("dev/tenants/16/" + OTHER_FILE, modified))
                        .isTruncated(false).build());

        assertEquals(2, withStorage(storage).listStoredImages(16L).size());
    }

    @Test
    void withoutCredentialsListingFindsNothing() {
        assertTrue(new ImageUploadService("", "", "", "", "", "").listStoredImages(16L).isEmpty());
    }
}
