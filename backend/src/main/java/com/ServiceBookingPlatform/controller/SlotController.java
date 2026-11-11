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
    private final com.ServiceBookingPlatform.service.ServiceCatalogService serviceCatalogService;

    @GetMapping("/open-dates")
    public ResponseEntity<List<String>> getOpenDates(@RequestParam String from, @RequestParam String to,
                                                     @RequestParam Long serviceId) {
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
        int duration = serviceCatalogService.getById(serviceId).getDurationMinutes();
        return ResponseEntity.ok(slotCalculatorService.getOpenDates(start, end, duration).stream()
                .map(LocalDate::toString).collect(Collectors.toList()));
    }

    @GetMapping
    public ResponseEntity<List<String>> getSlots(@RequestParam String date, @RequestParam Long serviceId) {
        LocalDate localDate;
        try {
            localDate = LocalDate.parse(date);
        } catch (DateTimeParseException ex) {
            throw new InvalidDateException("Invalid date format: " + date);
        }
        int duration = serviceCatalogService.getById(serviceId).getDurationMinutes();
        List<String> result = slotCalculatorService.getAvailableSlots(localDate, duration).stream()
            .map(slot -> slot.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
