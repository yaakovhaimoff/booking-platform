package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.exception.InvalidDateException;
import com.ServiceBookingPlatform.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlotCalculatorService {

    private static final LocalTime DAY_START = LocalTime.of(9, 0);
    private static final LocalTime DAY_END   = LocalTime.of(17, 0);

    private final AppointmentRepository appointmentRepository;

    public List<LocalDateTime> getAvailableSlots(LocalDate date, int slotDurationMinutes) {
        if (date.isBefore(LocalDate.now())) {
            throw new InvalidDateException("Date is in the past: " + date);
        }
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) {
            throw new InvalidDateException("Date falls on a weekend: " + date);
        }

        List<LocalDateTime> allSlots = new ArrayList<>();
        LocalDateTime slot = date.atTime(DAY_START);
        LocalDateTime endOfDay = date.atTime(DAY_END);
        while (!slot.isAfter(endOfDay.minusMinutes(slotDurationMinutes))) {
            allSlots.add(slot);
            slot = slot.plusMinutes(slotDurationMinutes);
        }

        List<AppointmentEntity> blocking = appointmentRepository.findByStartTimeBetweenAndStatusIn(
            date.atTime(DAY_START),
            date.atTime(DAY_END),
            List.of("CONFIRMED", "PENDING")
        );
        Set<LocalDateTime> blocked = blocking.stream()
            .map(AppointmentEntity::getStartTime)
            .collect(Collectors.toSet());

        allSlots.removeIf(blocked::contains);
        return allSlots;
    }
}
