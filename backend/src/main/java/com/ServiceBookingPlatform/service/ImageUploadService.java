package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.dto.UploadResponse;
import com.ServiceBookingPlatform.exception.UploadsNotConfiguredException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.time.Duration;
import java.util.Collection;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Hands out short-lived presigned PUT addresses for Cloudflare R2, so photos go from the browser straight to
 * storage and never pass through this server. The signed type and size make R2 refuse anything else.
 * Also removes a shop's own files from storage once the profile no longer uses them.
 */
@Slf4j
@Service
public class ImageUploadService {

    static final long MAX_BYTES = 2_000_000;
    private static final Duration LINK_LIFETIME = Duration.ofMinutes(5);
    private static final Map<String, String> EXTENSIONS =
            Map.of("image/webp", "webp", "image/jpeg", "jpg", "image/png", "png");

    private static final Pattern FILE_NAME = Pattern.compile("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(webp|jpg|png)");

    private final String bucket;
    private final String publicBaseUrl;
    private final S3Presigner presigner;
    private final S3Client storageClient;

    @Autowired
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
        if (configured) {
            URI endpoint = URI.create("https://" + accountId + ".r2.cloudflarestorage.com");
            StaticCredentialsProvider credentials = StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKeyId, secretAccessKey));
            S3Configuration pathStyle = S3Configuration.builder().pathStyleAccessEnabled(true).build();
            this.presigner = S3Presigner.builder()
                    .region(Region.of("auto"))
                    .endpointOverride(endpoint)
                    .credentialsProvider(credentials)
                    .serviceConfiguration(pathStyle)
                    .build();
            this.storageClient = S3Client.builder()
                    .region(Region.of("auto"))
                    .endpointOverride(endpoint)
                    .credentialsProvider(credentials)
                    .serviceConfiguration(pathStyle)
                    .httpClientBuilder(UrlConnectionHttpClient.builder())
                    .build();
        } else {
            this.presigner = null;
            this.storageClient = null;
        }
    }

    ImageUploadService(String bucket, String publicUrl, S3Presigner presigner, S3Client storageClient) {
        this.bucket = bucket;
        this.publicBaseUrl = publicUrl.replaceAll("/+$", "");
        this.presigner = presigner;
        this.storageClient = storageClient;
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

    /**
     * Deletes the stored files behind these addresses, but only those inside this shop's own folder. Anything
     * else (pasted outside links, another shop's files, odd file names) is skipped. A failed delete is logged
     * and never thrown, so the caller's own work is not undone by a storage hiccup.
     */
    public void deleteOwnedImages(Long tenantId, Collection<String> urls) {
        if (!isConfigured() || storageClient == null) {
            return;
        }
        for (String url : urls) {
            String key = ownedKey(tenantId, url);
            if (key == null) {
                continue;
            }
            try {
                storageClient.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
            } catch (RuntimeException exception) {
                log.warn("Could not delete {} from storage: {}", key, exception.getMessage());
            }
        }
    }

    private String ownedKey(Long tenantId, String url) {
        String folder = publicBaseUrl + "/tenants/" + tenantId + "/";
        if (url == null || !url.startsWith(folder)) {
            return null;
        }
        String fileName = url.substring(folder.length());
        Matcher matcher = FILE_NAME.matcher(fileName);
        return matcher.matches() ? "tenants/" + tenantId + "/" + fileName : null;
    }
}
