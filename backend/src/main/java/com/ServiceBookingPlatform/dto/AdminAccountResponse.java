package com.ServiceBookingPlatform.dto;

import com.ServiceBookingPlatform.entity.AccountEntity;
import com.ServiceBookingPlatform.entity.TenantEntity;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/** An account with every detail the admin may see. Never carries the password hash. */
@Data @Builder
public class AdminAccountResponse {
    private Long id;
    private String identity;
    private String name;
    private String phone;
    private String accountType;
    private LocalDateTime createdAt;
    private Long ownedShopId;
    private String ownedShopName;
    private String ownedShopSlug;

    public static AdminAccountResponse from(AccountEntity account, TenantEntity ownedShop) {
        return builder()
            .id(account.getId()).identity(account.getIdentity()).name(account.getName())
            .phone(account.getPhone()).accountType(account.getAccountType()).createdAt(account.getCreatedAt())
            .ownedShopId(ownedShop == null ? null : ownedShop.getId())
            .ownedShopName(ownedShop == null ? null : ownedShop.getName())
            .ownedShopSlug(ownedShop == null ? null : ownedShop.getSlug())
            .build();
    }
}
