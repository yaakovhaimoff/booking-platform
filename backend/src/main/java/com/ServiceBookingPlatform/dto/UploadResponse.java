package com.ServiceBookingPlatform.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UploadResponse {
    /** Short-lived address the browser sends the file to with a PUT. */
    private String uploadUrl;
    /** Permanent address of the image once uploaded: this is what gets saved on the profile. */
    private String publicUrl;
    /** Headers the PUT must carry exactly as signed (type and caching); the browser sets the length itself. */
    private java.util.Map<String, String> headers;
}
