package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.ServiceEntity;
import com.ServiceBookingPlatform.entity.TenantEntity;

/**
 * Everything the business logic wants to tell people goes through here, so the channel
 * (log, email, WhatsApp/SMS) can change without touching booking code.
 * Implementations must never throw: a failed notification must not fail a booking.
 */
public interface NotificationService {

    /** A customer just requested an appointment. */
    void bookingCreated(TenantEntity tenant, AppointmentEntity appointment, ServiceEntity service);

    /** Status changed. {@code byOwner} is false when the customer did it (e.g. cancelled). */
    void statusChanged(TenantEntity tenant, AppointmentEntity appointment, boolean byOwner);
}
