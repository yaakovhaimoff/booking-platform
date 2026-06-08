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
