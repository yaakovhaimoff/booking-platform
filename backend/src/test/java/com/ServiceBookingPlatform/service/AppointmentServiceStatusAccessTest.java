package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.AppointmentStatus;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.exception.ForbiddenException;
import com.ServiceBookingPlatform.multitenancy.TenantContextHolder;
import com.ServiceBookingPlatform.repository.AppointmentRepository;
import com.ServiceBookingPlatform.repository.TenantRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AppointmentServiceStatusAccessTest {

    private AppointmentRepository appointments;
    private TenantRepository tenants;
    private AppointmentService service;

    @BeforeEach
    void setUp() {
        appointments = mock(AppointmentRepository.class);
        tenants = mock(TenantRepository.class);
        service = new AppointmentService(appointments, mock(ServiceCatalogService.class), tenants,
                mock(SlotCalculatorService.class), mock(NotificationService.class), mock(TransactionTemplate.class));
        TenantContextHolder.setCurrentSchema("tenant_5");
        when(appointments.save(any(AppointmentEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private static AuthenticatedUser user(String subject, Long accountId) {
        return new AuthenticatedUser(subject, null, null, "consumer", null, accountId);
    }

    private void shop(Long ownerAccountId, String ownerSubject) {
        when(tenants.findById(5L)).thenReturn(Optional.of(
                TenantEntity.builder().id(5L).ownerAccountId(ownerAccountId).ownerAuth0Id(ownerSubject).build()));
    }

    private void booking(Long clientAccountId, String clientSubject) {
        when(appointments.findById(1L)).thenReturn(Optional.of(AppointmentEntity.builder().id(1L).serviceId(1L)
                .clientName("Ann").clientPhone("1").startTime(LocalDateTime.now()).endTime(LocalDateTime.now())
                .status(AppointmentStatus.PENDING).clientAccountId(clientAccountId).clientAuth0Sub(clientSubject).build()));
    }

    @Test
    void theShopOwnerAccountCanConfirm() {
        shop(7L, "local|7");
        booking(9L, "local|9");

        assertEquals(AppointmentStatus.CONFIRMED, service.updateStatus(1L, "CONFIRMED", user("local|7", 7L)).getStatus());
    }

    @Test
    void theBookingsOwnAccountCanCancelButAnotherAccountCannotTouchIt() {
        shop(7L, "local|7");
        booking(9L, "local|9");

        assertEquals(AppointmentStatus.CANCELLED, service.updateStatus(1L, "CANCELLED", user("local|9", 9L)).getStatus());
        booking(9L, "local|9");
        assertThrows(ForbiddenException.class, () -> service.updateStatus(1L, "CANCELLED", user("local|8", 8L)));
    }

    @Test
    void aBookingWithAnAccountIdIsNotReachableThroughTheOldSubjectOfAnotherAccount() {
        shop(7L, "local|7");
        booking(9L, "local|9");

        assertThrows(ForbiddenException.class, () -> service.updateStatus(1L, "CANCELLED", user("local|9", 8L)));
    }

    @Test
    void anOlderBookingWithoutAnAccountIdStillBelongsToItsOldSubject() {
        shop(7L, "local|7");
        booking(null, "local|9");

        assertEquals(AppointmentStatus.CANCELLED, service.updateStatus(1L, "CANCELLED", user("local|9", 9L)).getStatus());
    }

    @Test
    void aGuestBookingBelongsToNobodyButTheShopOwner() {
        shop(7L, "local|7");
        booking(null, null);

        assertThrows(ForbiddenException.class, () -> service.updateStatus(1L, "CANCELLED", user("local|9", 9L)));
        assertEquals(AppointmentStatus.CONFIRMED, service.updateStatus(1L, "CONFIRMED", user("local|7", 7L)).getStatus());
    }

    @Test
    void aShopFromBeforeAccountIdsIsStillManagedByItsOldOwnerSubject() {
        shop(null, "dev|owner1");
        booking(null, null);

        assertEquals(AppointmentStatus.CONFIRMED, service.updateStatus(1L, "CONFIRMED", user("dev|owner1", null)).getStatus());
    }
}
