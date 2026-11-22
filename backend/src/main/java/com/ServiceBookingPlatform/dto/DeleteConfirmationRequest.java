package com.ServiceBookingPlatform.dto;

import lombok.Data;

/** What the admin typed to confirm a permanent delete: the shop's slug or the account's identity. */
@Data
public class DeleteConfirmationRequest {
    private String confirmation;
}
