package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.AppointmentStatus;
import com.ServiceBookingPlatform.repository.AppointmentRepository;
import com.ServiceBookingPlatform.repository.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class AppointmentServiceClaimTest {

    private static final String ME = "local|9";

    private AppointmentRepository repository;
    private AppointmentService service;

    @BeforeEach
    void setUp() {
        repository = mock(AppointmentRepository.class);
        service = new AppointmentService(repository, mock(ServiceCatalogService.class), mock(TenantRepository.class),
                mock(SlotCalculatorService.class), mock(NotificationService.class), mock(TransactionTemplate.class));
        when(repository.findByClientAuth0SubOrderByStartTimeDesc(ME)).thenReturn(List.of());
    }

    private static AppointmentEntity guest(String name, String phone) {
        return AppointmentEntity.builder().serviceId(1L).clientName(name).clientPhone(phone)
                .startTime(LocalDateTime.now()).endTime(LocalDateTime.now()).status(AppointmentStatus.PENDING).build();
    }

    private void candidates(AppointmentEntity... found) {
        when(repository.findByClientAuth0SubIsNullAndClientPhoneEndingWith(any())).thenReturn(List.of(found));
    }

    @Test
    void aGuestBookingWithTheSamePhoneAndNameIsLinkedToTheAccount() {
        AppointmentEntity mine = guest("Anna Bianchi", "3331112222");
        candidates(mine);

        service.getMyAppointments(ME, "anna  bianchi", "393331112222");

        assertEquals(ME, mine.getClientAuth0Sub());
        ArgumentCaptor<List<AppointmentEntity>> saved = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(saved.capture());
        assertEquals(List.of(mine), saved.getValue());
    }

    @Test
    void onlyTheMatchingBookingsAreLinkedWhenOthersShareAPhoneOrAName() {
        AppointmentEntity mine = guest("Anna Bianchi", "3331112222");
        AppointmentEntity sameNumberOtherPerson = guest("Marta Rossi", "3331112222");
        AppointmentEntity sameNameOtherNumber = guest("Anna Bianchi", "3339998888");
        candidates(mine, sameNumberOtherPerson, sameNameOtherNumber);

        service.getMyAppointments(ME, "Anna Bianchi", "3331112222");

        assertEquals(ME, mine.getClientAuth0Sub());
        assertNull(sameNumberOtherPerson.getClientAuth0Sub());
        assertNull(sameNameOtherNumber.getClientAuth0Sub());
    }

    @Test
    void nothingIsSavedWhenNothingMatches() {
        candidates(guest("Marta Rossi", "3331112222"));

        service.getMyAppointments(ME, "Anna Bianchi", "3331112222");

        verify(repository, never()).saveAll(anyList());
    }

    @Test
    void lookupUsesOnlyGuestBookingsSoAnotherAccountsBookingCanNeverBeTaken() {
        candidates();

        service.getMyAppointments(ME, "Anna Bianchi", "+39 333 111 2222");

        verify(repository).findByClientAuth0SubIsNullAndClientPhoneEndingWith("31112222");
        verify(repository, never()).findAll();
    }

    @Test
    void noClaimIsAttemptedWithoutAPhoneOrAName() {
        service.getMyAppointments(ME, "Anna Bianchi", null);
        service.getMyAppointments(ME, "Anna Bianchi", "");
        service.getMyAppointments(ME, null, "3331112222");
        service.getMyAppointments(ME, "  ", "3331112222");

        verify(repository, never()).findByClientAuth0SubIsNullAndClientPhoneEndingWith(any());
        verify(repository, never()).saveAll(anyList());
    }

    @Test
    void theReturnedListIsTheAccountsBookingsAfterLinking() {
        AppointmentEntity existing = guest("Anna Bianchi", "3331112222");
        existing.setClientAuth0Sub(ME);
        when(repository.findByClientAuth0SubOrderByStartTimeDesc(ME)).thenReturn(List.of(existing));
        candidates();

        assertEquals(List.of(existing), service.getMyAppointments(ME, "Anna Bianchi", "3331112222"));
        verify(repository, times(1)).findByClientAuth0SubOrderByStartTimeDesc(eq(ME));
    }
}
