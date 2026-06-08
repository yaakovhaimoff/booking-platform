package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.dto.ServiceRequest;
import com.ServiceBookingPlatform.entity.ServiceEntity;
import com.ServiceBookingPlatform.exception.ServiceNotFoundException;
import com.ServiceBookingPlatform.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceCatalogService {

    private final ServiceRepository serviceRepository;

    public List<ServiceEntity> getAllServices() {
        return serviceRepository.findAll();
    }

    public ServiceEntity getById(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new ServiceNotFoundException(id));
    }

    public ServiceEntity createService(ServiceRequest request) {
        ServiceEntity entity = ServiceEntity.builder()
                .name(request.getName())
                .durationMinutes(request.getDurationMinutes())
                .price(request.getPrice())
                .build();
        return serviceRepository.save(entity);
    }

    public ServiceEntity updateService(Long id, ServiceRequest request) {
        ServiceEntity entity = serviceRepository.findById(id)
                .orElseThrow(() -> new ServiceNotFoundException(id));
        entity.setName(request.getName());
        entity.setDurationMinutes(request.getDurationMinutes());
        entity.setPrice(request.getPrice());
        return serviceRepository.save(entity);
    }

    public void deleteService(Long id) {
        if (!serviceRepository.existsById(id)) {
            throw new ServiceNotFoundException(id);
        }
        serviceRepository.deleteById(id);
    }
}
