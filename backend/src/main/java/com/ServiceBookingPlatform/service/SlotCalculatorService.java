package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.AppointmentStatus;
import com.ServiceBookingPlatform.entity.OperatingHoursEntity;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.multitenancy.TenantContextHolder;
import com.ServiceBookingPlatform.repository.AppointmentRepository;
import com.ServiceBookingPlatform.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Computes bookable start times for one service on one day (or many days at once).
 *
 * Rules:
 *  - starts are on a 30-minute grid from opening time;
 *  - the whole [start, start + duration) must fit inside opening hours;
 *  - it must not overlap any PENDING or CONFIRMED appointment (interval overlap, not start equality);
 *  - it must start at least MIN_NOTICE_MINUTES from "now" in the shop's timezone, so past
 *    times (and times too soon to be realistic) are never offered.
 */
@Service
@RequiredArgsConstructor
public class SlotCalculatorService {

    static final int STEP_MINUTES = 30;
    static final int MIN_NOTICE_MINUTES = 30;
    static final String DEFAULT_ZONE = "Europe/Rome";
    private static final List<AppointmentStatus> BLOCKING = List.of(AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING);

    private final AppointmentRepository appointmentRepository;
    private final OperatingHoursService operatingHoursService;
    private final TenantRepository tenantRepository;

    /** Current time in the shop's timezone. Overridable seam for tests. */
    LocalDateTime nowInShopZone() {
        return LocalDateTime.now(shopZone());
    }

    ZoneId shopZone() {
        Long tenantId = TenantContextHolder.getTenantId();
        String id = tenantRepository.findById(tenantId).map(TenantEntity::getTimezone).orElse(null);
        try {
            return ZoneId.of(id == null || id.isBlank() ? DEFAULT_ZONE : id);
        } catch (DateTimeException e) {
            return ZoneId.of(DEFAULT_ZONE);
        }
    }

    /** Free start times on {@code date} for a service lasting {@code durationMinutes}. Past dates give an empty list. */
    public List<LocalDateTime> getAvailableSlots(LocalDate date, int durationMinutes) {
        LocalDateTime now = nowInShopZone();
        if (date.isBefore(now.toLocalDate())) {
            return List.of();
        }
        Long tenantId = TenantContextHolder.getTenantId();
        Map<Integer, OperatingHoursEntity> hours = hoursByDay(tenantId);
        List<AppointmentEntity> booked = appointmentRepository.findOverlapping(
                date.atStartOfDay(), date.plusDays(1).atStartOfDay(), BLOCKING);
        return slotsFor(date, hours, booked, durationMinutes, now);
    }

    /** Dates in [from, to] with at least one free start time. Hours are read once and bookings in one query. */
    public List<LocalDate> getOpenDates(LocalDate from, LocalDate to, int durationMinutes) {
        LocalDateTime now = nowInShopZone();
        LocalDate first = from.isBefore(now.toLocalDate()) ? now.toLocalDate() : from;
        List<LocalDate> result = new ArrayList<>();
        if (first.isAfter(to)) {
            return result;
        }
        Long tenantId = TenantContextHolder.getTenantId();
        Map<Integer, OperatingHoursEntity> hours = hoursByDay(tenantId);
        List<AppointmentEntity> booked = appointmentRepository.findOverlapping(
                first.atStartOfDay(), to.plusDays(1).atStartOfDay(), BLOCKING);
        for (LocalDate d = first; !d.isAfter(to); d = d.plusDays(1)) {
            if (!slotsFor(d, hours, booked, durationMinutes, now).isEmpty()) {
                result.add(d);
            }
        }
        return result;
    }

    /** True if {@code start} is one of the currently offered slots for this duration. */
    public boolean isBookable(LocalDateTime start, int durationMinutes) {
        return getAvailableSlots(start.toLocalDate(), durationMinutes).contains(start);
    }

    private Map<Integer, OperatingHoursEntity> hoursByDay(Long tenantId) {
        return operatingHoursService.getHours(tenantId).stream()
                .collect(Collectors.toMap(OperatingHoursEntity::getDayOfWeek, Function.identity(), (a, b) -> a));
    }

    private List<LocalDateTime> slotsFor(LocalDate date, Map<Integer, OperatingHoursEntity> hours,
                                         List<AppointmentEntity> booked, int durationMinutes, LocalDateTime now) {
        // Java DayOfWeek: MONDAY=1 … SUNDAY=7; our DB: 0=Monday … 6=Sunday
        OperatingHoursEntity row = hours.get(date.getDayOfWeek().getValue() - 1);
        if (row == null || row.isClosed() || row.getOpenTime() == null || row.getCloseTime() == null) {
            return List.of();
        }
        LocalDateTime open = date.atTime(LocalTime.parse(row.getOpenTime()));
        LocalDateTime close = date.atTime(LocalTime.parse(row.getCloseTime()));
        LocalDateTime earliest = now.plusMinutes(MIN_NOTICE_MINUTES);

        List<LocalDateTime> slots = new ArrayList<>();
        for (LocalDateTime start = open; !start.plusMinutes(durationMinutes).isAfter(close); start = start.plusMinutes(STEP_MINUTES)) {
            if (start.isBefore(earliest)) continue;
            LocalDateTime end = start.plusMinutes(durationMinutes);
            final LocalDateTime s = start;
            boolean clash = booked.stream().anyMatch(a -> a.getStartTime().isBefore(end) && a.getEndTime().isAfter(s));
            if (!clash) slots.add(start);
        }
        return slots;
    }
}
