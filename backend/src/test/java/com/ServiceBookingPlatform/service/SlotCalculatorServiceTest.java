package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.AppointmentStatus;
import com.ServiceBookingPlatform.entity.OperatingHoursEntity;
import com.ServiceBookingPlatform.multitenancy.TenantContextHolder;
import com.ServiceBookingPlatform.repository.AppointmentRepository;
import com.ServiceBookingPlatform.repository.TenantRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SlotCalculatorServiceTest {

    // Wednesday 2026-11-11, 12:00 in the shop's zone
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 11, 12, 0);
    private static final LocalDate TODAY = NOW.toLocalDate();
    private static final LocalDate TOMORROW = TODAY.plusDays(1);

    private final List<AppointmentEntity> booked = new ArrayList<>();
    private SlotCalculatorService calc;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setCurrentSchema("tenant_1");
        AppointmentRepository appts = mock(AppointmentRepository.class);
        when(appts.findOverlapping(any(), any(), any())).thenAnswer(inv -> {
            LocalDateTime from = inv.getArgument(0), to = inv.getArgument(1);
            return booked.stream().filter(a -> a.getStartTime().isBefore(to) && a.getEndTime().isAfter(from)).toList();
        });
        OperatingHoursService hours = mock(OperatingHoursService.class);
        List<OperatingHoursEntity> week = new ArrayList<>();
        for (int d = 0; d < 7; d++) {
            // Sunday (6) closed, everything else 09:00-17:00
            week.add(OperatingHoursEntity.builder().tenantId(1L).dayOfWeek(d).openTime("09:00").closeTime("17:00").closed(d == 6).build());
        }
        when(hours.getHours(1L)).thenReturn(week);
        calc = new SlotCalculatorService(appts, hours, mock(TenantRepository.class)) {
            @Override LocalDateTime nowInShopZone() { return NOW; }
        };
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private static AppointmentEntity appt(LocalDateTime start, int minutes, AppointmentStatus status) {
        return AppointmentEntity.builder().serviceId(1L).clientName("x").clientPhone("1")
                .startTime(start).endTime(start.plusMinutes(minutes)).status(status).build();
    }

    @Test
    void fullDayGridUsesServiceDurationToFitClosingTime() {
        List<LocalDateTime> thirty = calc.getAvailableSlots(TOMORROW, 30);
        List<LocalDateTime> sixty = calc.getAvailableSlots(TOMORROW, 60);
        assertEquals(TOMORROW.atTime(9, 0), thirty.get(0));
        assertEquals(TOMORROW.atTime(16, 30), thirty.get(thirty.size() - 1));
        assertEquals(TOMORROW.atTime(16, 0), sixty.get(sixty.size() - 1), "a 60 min service cannot start at 16:30");
    }

    @Test
    void pastDaysReturnNothingInsteadOfFailing() {
        assertTrue(calc.getAvailableSlots(TODAY.minusDays(1), 30).isEmpty());
    }

    @Test
    void todayHidesPastTimesAndRespectsMinimumNotice() {
        List<LocalDateTime> slots = calc.getAvailableSlots(TODAY, 30);
        // now 12:00 + 30 min notice -> first offer is 12:30
        assertEquals(TODAY.atTime(12, 30), slots.get(0));
        assertTrue(slots.stream().noneMatch(s -> s.isBefore(NOW)));
    }

    @Test
    void longServiceIsBlockedByBookingThatStartsInsideIt() {
        booked.add(appt(TOMORROW.atTime(10, 0), 30, AppointmentStatus.CONFIRMED));
        List<LocalDateTime> sixty = calc.getAvailableSlots(TOMORROW, 60);
        assertFalse(sixty.contains(TOMORROW.atTime(9, 30)), "09:30-10:30 overlaps the 10:00 booking");
        assertFalse(sixty.contains(TOMORROW.atTime(10, 0)));
        assertTrue(sixty.contains(TOMORROW.atTime(9, 0)), "09:00-10:00 ends exactly when the booking starts");
        assertTrue(sixty.contains(TOMORROW.atTime(10, 30)), "starts exactly when the booking ends");
    }

    @Test
    void longBookingBlocksLaterShortSlots() {
        booked.add(appt(TOMORROW.atTime(10, 0), 60, AppointmentStatus.PENDING));
        List<LocalDateTime> thirty = calc.getAvailableSlots(TOMORROW, 30);
        assertFalse(thirty.contains(TOMORROW.atTime(10, 30)), "inside the 10:00-11:00 booking");
        assertTrue(thirty.contains(TOMORROW.atTime(11, 0)));
    }

    @Test
    void closedDayHasNoSlots() {
        LocalDate sunday = TOMORROW.plusDays(3); // 2026-11-15
        assertEquals(6, sunday.getDayOfWeek().getValue() - 1);
        assertTrue(calc.getAvailableSlots(sunday, 30).isEmpty());
    }

    @Test
    void openDatesSkipsClosedDaysPastDaysAndFullyBookedDays() {
        // fully book tomorrow with one all-day appointment
        booked.add(appt(TOMORROW.atTime(9, 0), 8 * 60, AppointmentStatus.CONFIRMED));
        List<LocalDate> open = calc.getOpenDates(TODAY.minusDays(5), TODAY.plusDays(5), 30);
        assertTrue(open.contains(TODAY));
        assertFalse(open.contains(TODAY.minusDays(1)));
        assertFalse(open.contains(TOMORROW), "fully booked");
        assertFalse(open.contains(TODAY.plusDays(4)), "Sunday is closed");
    }

    @Test
    void isBookableRejectsOffGridPastAndOverlappingStarts() {
        booked.add(appt(TOMORROW.atTime(10, 0), 30, AppointmentStatus.CONFIRMED));
        assertTrue(calc.isBookable(TOMORROW.atTime(9, 0), 30));
        assertFalse(calc.isBookable(TOMORROW.atTime(10, 0), 30), "taken");
        assertFalse(calc.isBookable(TOMORROW.atTime(9, 10), 30), "off the 30 min grid");
        assertFalse(calc.isBookable(TOMORROW.atTime(8, 0), 30), "before opening");
        assertFalse(calc.isBookable(TODAY.atTime(9, 0), 30), "in the past");
    }

    @Test
    void cancelledBookingsDoNotBlock() {
        // The repository query only returns PENDING/CONFIRMED, so a cancelled one never reaches the calculator.
        assertTrue(calc.getAvailableSlots(TOMORROW, 30).contains(TOMORROW.atTime(10, 0)));
    }
}
