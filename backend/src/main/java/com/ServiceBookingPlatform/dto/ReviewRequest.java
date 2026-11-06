package com.ServiceBookingPlatform.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ReviewRequest {

    @Min(1) @Max(5)
    private int rating;

    // Guests must type a name; signed-in users send their account name.
    @NotBlank @Size(max = 100)
    private String authorName;

    @Size(max = 1000)
    private String comment;

    // Present when the reviewer is signed in (same mechanism as AppointmentRequest.clientAuth0Sub).
    private String authorAuth0Sub;
}
