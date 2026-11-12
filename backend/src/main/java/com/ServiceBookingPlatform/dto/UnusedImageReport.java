package com.ServiceBookingPlatform.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data @Builder
public class UnusedImageReport {
    private boolean dryRun;
    private int tenantsScanned;
    private List<String> unusedFiles;
    private int skippedBecauseRecent;
    private int deleted;
}
