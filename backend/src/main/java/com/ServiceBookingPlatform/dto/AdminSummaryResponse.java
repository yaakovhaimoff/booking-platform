package com.ServiceBookingPlatform.dto;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class AdminSummaryResponse {
    private int shops;
    private int visibleShops;
    private int hiddenShops;
    private int accounts;
    private int businessAccounts;
    private int consumerAccounts;
    private int clients;
    private int bookings;
    private int reviews;
}
