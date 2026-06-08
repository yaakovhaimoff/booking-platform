package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.AppointmentStatus;
import com.ServiceBookingPlatform.entity.OperatingHoursEntity;
import com.ServiceBookingPlatform.exception.InvalidDateException;
import com.ServiceBookingPlatform.multitenancy.TenantContextHolder;
import com.ServiceBookingPlatform.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlotCalculatorService {

    private final AppointmentRepository appointmentRepository;
    private final OperatingHoursService operatingHoursService;

    public List<LocalDateTime> getAvailableSlots(LocalDate date, int slotDurationMinutes) {
        if (date.isBefore(LocalDate.now())) {
            throw new InvalidDateException("Date is in the past: " + date);
        }

        Long tenantId = TenantContextHolder.getTenantId();
        List<OperatingHoursEntity> hours = operatingHoursService.getHours(tenantId);

        // Java DayOfWeek: MONDAY=1 … SUNDAY=7; our DB: 0=Monday … 6=Sunday
        int dowIndex = date.getDayOfWeek().getValue() - 1;
        Optional<OperatingHoursEntity> row = hours.stream()
                .filter(h -> h.getDayOfWeek() == dowIndex)
                .findFirst();

        if (row.isEmpty() || row.get().isClosed()) {
            return List.of();
        }

        LocalTime dayStart = LocalTime.parse(row.get().getOpenTime());
        LocalTime dayEnd   = LocalTime.parse(row.get().getCloseTime());

        List<LocalDateTime> allSlots = new ArrayList<>();
        LocalDateTime slot = date.atTime(dayStart);
        LocalDateTime endOfDay = date.atTime(dayEnd);
        while (!slot.isAfter(endOfDay.minusMinutes(slotDurationMinutes))) {
            allSlots.add(slot);
            slot = slot.plusMinutes(slotDurationMinutes);
        }

        List<AppointmentEntity> blocking = appointmentRepository.findByStartTimeBetweenAndStatusIn(
                date.atTime(dayStart),
                date.atTime(dayEnd),
                List.of(AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING)
        );
        Set<LocalDateTime> blocked = blocking.stream()
                .map(AppointmentEntity::getStartTime)
                .collect(Collectors.toSet());

        allSlots.removeIf(blocked::contains);
        return allSlots;
    }
}
