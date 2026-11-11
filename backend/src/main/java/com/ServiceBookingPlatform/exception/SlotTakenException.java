package com.ServiceBookingPlatform.exception;

import java.util.List;

/** The requested start time is no longer bookable. Carries fresh slots so the client can re-pick. */
public class SlotTakenException extends RuntimeException {
    private final transient List<String> freshSlots;

    public SlotTakenException(String message, List<String> freshSlots) {
        super(message);
        this.freshSlots = freshSlots;
    }

    public List<String> getFreshSlots() {
        return freshSlots;
    }
}
