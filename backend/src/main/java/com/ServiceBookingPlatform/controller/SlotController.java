package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.exception.InvalidDateException;
import com.ServiceBookingPlatform.service.SlotCalculatorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/slots")
@RequiredArgsConstructor
public class SlotController {

    private final SlotCalculatorService slotCalculatorService;

    @GetMapping("/open-dates")
    public ResponseEntity<List<String>> getOpenDates(@RequestParam String from, @RequestParam String to) {
        LocalDate start;
        LocalDate end;
        try {
            start = LocalDate.parse(from);
            end = LocalDate.parse(to);
        } catch (DateTimeParseException ex) {
            throw new InvalidDateException("Invalid date format");
        }
        if (end.isBefore(start) || start.plusDays(62).isBefore(end)) {
            throw new InvalidDateException("Invalid date range");
        }
        LocalDate today = LocalDate.now();
        List<String> result = new java.util.ArrayList<>();
        for (LocalDate d = start.isBefore(today) ? today : start; !d.isAfter(end); d = d.plusDays(1)) {
            if (!slotCalculatorService.getAvailableSlots(d, 30).isEmpty()) {
                result.add(d.toString());
            }
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<List<String>> getSlots(@RequestParam String date) {
        LocalDate localDate;
        try {
            localDate = LocalDate.parse(date);
        } catch (DateTimeParseException ex) {
            throw new InvalidDateException("Invalid date format: " + date);
        }

        List<LocalDateTime> slots = slotCalculatorService.getAvailableSlots(localDate, 30);
        List<String> result = slots.stream()
            .map(slot -> slot.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
