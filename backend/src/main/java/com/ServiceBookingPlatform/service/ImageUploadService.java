package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.dto.UploadResponse;
import com.ServiceBookingPlatform.exception.UploadsNotConfiguredException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.time.Duration;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

/**
 * Hands out short-lived presigned PUT addresses for Cloudflare R2, so photos go from the browser straight to
 * storage and never pass through this server. The signed type and size make R2 refuse anything else.
 */
@Service
public class ImageUploadService {

    static final long MAX_BYTES = 2_000_000;
    private static final Duration LINK_LIFETIME = Duration.ofMinutes(5);
    private static final Map<String, String> EXTENSIONS =
            Map.of("image/webp", "webp", "image/jpeg", "jpg", "image/png", "png");

    private final String bucket;
    private final String publicBaseUrl;
    private final S3Presigner presigner;

    public ImageUploadService(
            @Value("${app.uploads.account-id:}") String accountId,
            @Value("${app.uploads.access-key-id:}") String accessKeyId,
            @Value("${app.uploads.secret-access-key:}") String secretAccessKey,
            @Value("${app.uploads.bucket:}") String bucket,
            @Value("${app.uploads.public-url:}") String publicUrl) {
        this.bucket = bucket;
        this.publicBaseUrl = publicUrl.replaceAll("/+$", "");
        boolean configured = !accountId.isBlank() && !accessKeyId.isBlank() && !secretAccessKey.isBlank()
                && !bucket.isBlank() && !publicBaseUrl.isBlank();
        this.presigner = configured
                ? S3Presigner.builder()
                        .region(Region.of("auto"))
                        .endpointOverride(URI.create("https://" + accountId + ".r2.cloudflarestorage.com"))
                        .credentialsProvider(StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                        .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                        .build()
                : null;
    }

    public boolean isConfigured() {
        return presigner != null;
    }

    public UploadResponse createUpload(Long tenantId, String contentType, long sizeBytes) {
        if (!isConfigured()) {
            throw new UploadsNotConfiguredException();
        }
        String extension = EXTENSIONS.get(contentType == null ? "" : contentType.toLowerCase());
        if (extension == null) {
            throw new IllegalArgumentException("Only WebP, JPEG or PNG images are allowed");
        }
        if (sizeBytes < 1 || sizeBytes > MAX_BYTES) {
            throw new IllegalArgumentException("Images must be 2 MB or smaller");
        }
        String key = "tenants/" + tenantId + "/" + UUID.randomUUID() + "." + extension;
        PutObjectRequest put = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType.toLowerCase())
                .contentLength(sizeBytes)
                .cacheControl("public, max-age=31536000, immutable")
                .build();
        PresignedPutObjectRequest signed = presigner.presignPutObject(PutObjectPresignRequest.builder()
                .signatureDuration(LINK_LIFETIME)
                .putObjectRequest(put)
                .build());
        Map<String, String> headers = new TreeMap<>();
        signed.signedHeaders().forEach((name, values) -> {
            if (!name.equalsIgnoreCase("host") && !name.equalsIgnoreCase("content-length")) {
                headers.put(name, String.join(",", values));
            }
        });
        return UploadResponse.builder()
                .uploadUrl(signed.url().toString())
                .publicUrl(publicBaseUrl + "/" + key)
                .headers(headers)
                .build();
    }
}
