package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.dto.UploadResponse;
import com.ServiceBookingPlatform.exception.UploadsNotConfiguredException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ImageUploadServiceTest {

    private static ImageUploadService configured() {
        return new ImageUploadService("acct123", "keyid", "secretsecretsecret", "torni-images", "https://img.example.com/");
    }

    @Test
    void withoutCredentialsUploadsAreDisabledAndRefused() {
        ImageUploadService service = new ImageUploadService("", "", "", "", "");

        assertFalse(service.isConfigured());
        assertThrows(UploadsNotConfiguredException.class, () -> service.createUpload(1L, "image/webp", 1000));
    }

    @Test
    void aSignedLinkTargetsTheBucketAndTheTenantsOwnFolder() {
        UploadResponse response = configured().createUpload(42L, "image/webp", 150_000);

        assertTrue(response.getUploadUrl().startsWith("https://acct123.r2.cloudflarestorage.com/torni-images/tenants/42/"),
                response.getUploadUrl());
        assertTrue(response.getUploadUrl().contains("X-Amz-Signature="));
        assertTrue(response.getPublicUrl().startsWith("https://img.example.com/tenants/42/"));
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
}
