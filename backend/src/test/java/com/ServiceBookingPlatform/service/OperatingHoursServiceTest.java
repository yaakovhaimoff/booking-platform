package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.dto.OperatingHoursRequest;
import com.ServiceBookingPlatform.entity.OperatingHoursEntity;
import com.ServiceBookingPlatform.repository.OperatingHoursRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class OperatingHoursServiceTest {

    private OperatingHoursRepository repository;
    private OperatingHoursService service;

    @BeforeEach
    void setUp() {
        repository = mock(OperatingHoursRepository.class);
        when(repository.findByTenantId(1L)).thenReturn(List.of());
        when(repository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        service = new OperatingHoursService(repository);
    }

    private static List<OperatingHoursRequest> week(String open, String close) {
        List<OperatingHoursRequest> rows = new ArrayList<>();
        for (int day = 0; day < 7; day++) {
            rows.add(OperatingHoursRequest.builder().dayOfWeek(day).openTime(open).closeTime(close).closed(false).build());
        }
        return rows;
    }

    private IllegalArgumentException rejected(List<OperatingHoursRequest> rows) {
        IllegalArgumentException error = assertThrows(IllegalArgumentException.class, () -> service.updateHours(1L, rows));
        verify(repository, never()).saveAll(anyList());
        return error;
    }

    @Test
    void aValidWeekIsSavedAndReturnedInDayOrder() {
        List<OperatingHoursEntity> saved = service.updateHours(1L, week("09:00", "17:30"));

        assertEquals(7, saved.size());
        assertEquals(0, saved.get(0).getDayOfWeek());
        assertEquals("09:00", saved.get(3).getOpenTime());
        assertEquals("17:30", saved.get(3).getCloseTime());
    }

    @Test
    void midnightAndLastMinuteAreAcceptedAsBounds() {
        assertDoesNotThrow(() -> service.updateHours(1L, week("00:00", "23:59")));
    }

    @ParameterizedTest
    @ValueSource(strings = {"9:00", "24:00", "09:60", "abc", "09:00:00", "09-00", " 09:00", "", "9", "09:5"})
    void aBadClockTimeIsRefusedBeforeItCanBreakTheCalendar(String bad) {
        assertTrue(rejected(week(bad, "17:00")).getMessage().contains("09:00"));
        assertTrue(rejected(week("09:00", bad)).getMessage().contains("09:00"));
    }

    @Test
    void closingMustBeAfterOpening() {
        assertEquals("openTime must be before closeTime", rejected(week("17:00", "09:00")).getMessage());
        assertEquals("openTime must be before closeTime", rejected(week("09:00", "09:00")).getMessage());
    }

    @Test
    void openDaysNeedBothTimes() {
        assertTrue(rejected(week(null, "17:00")).getMessage().contains("required"));
        assertTrue(rejected(week("09:00", null)).getMessage().contains("required"));
    }

    @Test
    void closedDaysIgnoreTheirTimes() {
        List<OperatingHoursRequest> rows = week("09:00", "17:00");
        rows.set(6, OperatingHoursRequest.builder().dayOfWeek(6).openTime("garbage").closeTime(null).closed(true).build());

        assertDoesNotThrow(() -> service.updateHours(1L, rows));
    }

    @Test
    void theWeekMustHaveSevenDistinctDaysZeroToSix() {
        assertTrue(rejected(week("09:00", "17:00").subList(0, 6)).getMessage().contains("exactly 7"));

        List<OperatingHoursRequest> duplicated = week("09:00", "17:00");
        duplicated.set(6, OperatingHoursRequest.builder().dayOfWeek(0).openTime("09:00").closeTime("17:00").closed(false).build());
        assertTrue(rejected(duplicated).getMessage().contains("0–6"));

        List<OperatingHoursRequest> outOfRange = week("09:00", "17:00");
        outOfRange.set(6, OperatingHoursRequest.builder().dayOfWeek(7).openTime("09:00").closeTime("17:00").closed(false).build());
        assertTrue(rejected(outOfRange).getMessage().contains("0–6"));
    }
}
