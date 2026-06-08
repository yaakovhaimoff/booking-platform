package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.dto.OperatingHoursRequest;
import com.ServiceBookingPlatform.entity.OperatingHoursEntity;
import com.ServiceBookingPlatform.repository.OperatingHoursRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OperatingHoursService {

    private final OperatingHoursRepository operatingHoursRepository;

    public List<OperatingHoursEntity> getHours(Long tenantId) {
        return operatingHoursRepository.findByTenantId(tenantId).stream()
                .sorted(Comparator.comparingInt(OperatingHoursEntity::getDayOfWeek))
                .collect(Collectors.toList());
    }

    @Transactional
    public List<OperatingHoursEntity> updateHours(Long tenantId, List<OperatingHoursRequest> rows) {
        if (rows.size() != 7) {
            throw new IllegalArgumentException("Must provide exactly 7 rows");
        }
        Set<Integer> days = rows.stream()
                .map(OperatingHoursRequest::getDayOfWeek)
                .collect(Collectors.toSet());
        if (days.size() != 7 || !days.containsAll(Set.of(0, 1, 2, 3, 4, 5, 6))) {
            throw new IllegalArgumentException("dayOfWeek values 0–6 must each appear exactly once");
        }
        for (OperatingHoursRequest row : rows) {
            if (!row.isClosed()) {
                if (row.getOpenTime() == null || row.getCloseTime() == null) {
                    throw new IllegalArgumentException(
                            "openTime and closeTime required when isClosed=false");
                }
                if (row.getOpenTime().compareTo(row.getCloseTime()) >= 0) {
                    throw new IllegalArgumentException("openTime must be before closeTime");
                }
            }
        }

        Map<Integer, OperatingHoursEntity> existing = operatingHoursRepository
                .findByTenantId(tenantId).stream()
                .collect(Collectors.toMap(OperatingHoursEntity::getDayOfWeek, e -> e));

        List<OperatingHoursEntity> toSave = rows.stream().map(req -> {
            OperatingHoursEntity entity = existing.getOrDefault(
                    req.getDayOfWeek(),
                    OperatingHoursEntity.builder().tenantId(tenantId).build());
            entity.setDayOfWeek(req.getDayOfWeek());
            entity.setOpenTime(req.getOpenTime());
            entity.setCloseTime(req.getCloseTime());
            entity.setClosed(req.isClosed());
            return entity;
        }).collect(Collectors.toList());

        return operatingHoursRepository.saveAll(toSave).stream()
                .sorted(Comparator.comparingInt(OperatingHoursEntity::getDayOfWeek))
                .collect(Collectors.toList());
    }
}
