package com.ServiceBookingPlatform.dto;

import com.ServiceBookingPlatform.entity.AccountEntity;

public record AuthResponse(String token, String identity, String name, String phone, String accountType) {

    public static AuthResponse of(String token, AccountEntity account) {
        return new AuthResponse(token, account.getIdentity(),
                account.getName() == null ? "" : account.getName(),
                account.getPhone() == null ? "" : account.getPhone(),
                account.getAccountType());
    }
}
