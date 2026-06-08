package com.ServiceBookingPlatform.service;

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
}
