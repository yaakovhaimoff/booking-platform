package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.dto.AppointmentRequest;
import com.ServiceBookingPlatform.dto.AppointmentResponse;
import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.ServiceEntity;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.multitenancy.TenantContextHolder;
import com.ServiceBookingPlatform.repository.AppointmentRepository;
import com.ServiceBookingPlatform.repository.TenantRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.RETURNS_DEEP_STUBS;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AppointmentServiceBookingApprovalTest {

    private TenantRepository tenants;
    private AppointmentRepository appointments;
    private NotificationService notifications;
    private AppointmentService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        tenants = mock(TenantRepository.class);
        appointments = mock(AppointmentRepository.class);
        notifications = mock(NotificationService.class);
        ServiceCatalogService catalog = mock(ServiceCatalogService.class);
        SlotCalculatorService slots = mock(SlotCalculatorService.class);
        TransactionTemplate transactionTemplate = mock(TransactionTemplate.class);

        when(catalog.getById(3L)).thenReturn(ServiceEntity.builder().id(3L).name("Haircut")
                .durationMinutes(30).price(BigDecimal.TEN).build());
        when(slots.isBookable(any(), anyInt())).thenReturn(true);
        when(transactionTemplate.execute(any())).thenAnswer(call ->
                ((TransactionCallback<Object>) call.getArgument(0)).doInTransaction(mock(TransactionStatus.class)));
        when(appointments.save(any(AppointmentEntity.class))).thenAnswer(call -> call.getArgument(0));

        service = new AppointmentService(appointments, catalog, tenants, slots, notifications, transactionTemplate);
        ReflectionTestUtils.setField(service, "entityManager", mock(EntityManager.class, RETURNS_DEEP_STUBS));
        TenantContextHolder.setCurrentSchema("tenant_5");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private static AppointmentRequest request() {
        AppointmentRequest request = new AppointmentRequest();
        request.setServiceId(3L);
        request.setClientName("Ann");
        request.setClientPhone("123456");
        request.setStartTime("2026-12-01T10:00:00");
        return request;
    }

    private void shopWithAutoConfirm(boolean autoConfirm) {
        when(tenants.findById(5L)).thenReturn(Optional.of(
                TenantEntity.builder().id(5L).autoConfirmBookings(autoConfirm).build()));
    }

    @Test
    void aBookingWaitsForTheOwnerWhenTheShopApprovesEachBooking() {
        shopWithAutoConfirm(false);

        AppointmentResponse response = service.book(request(), null);

        assertEquals("PENDING", response.getStatus());
    }

    @Test
    void aBookingIsConfirmedStraightAwayWhenTheShopUsesInstantBooking() {
        shopWithAutoConfirm(true);

        AppointmentResponse response = service.book(request(), null);

        assertEquals("CONFIRMED", response.getStatus());
        verify(notifications).bookingCreated(any(), any(), any());
    }

    @Test
    void theSavedAppointmentCarriesTheStatusThatWasReturned() {
        shopWithAutoConfirm(true);

        service.book(request(), null);

        org.mockito.ArgumentCaptor<AppointmentEntity> saved = org.mockito.ArgumentCaptor.forClass(AppointmentEntity.class);
        verify(appointments).save(saved.capture());
        assertEquals(com.ServiceBookingPlatform.entity.AppointmentStatus.CONFIRMED, saved.getValue().getStatus());
    }

    @Test
    void aNewShopDefaultsToApprovingEachBooking() {
        assertEquals(false, TenantEntity.builder().build().isAutoConfirmBookings());
    }
}
