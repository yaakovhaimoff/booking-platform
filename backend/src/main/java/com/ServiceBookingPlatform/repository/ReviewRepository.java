package com.ServiceBookingPlatform.repository;

import com.ServiceBookingPlatform.entity.ReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {
    List<ReviewEntity> findAllByOrderByCreatedAtDesc();

    Optional<ReviewEntity> findByAuthorAuth0Sub(String authorAuth0Sub);

    Optional<ReviewEntity> findByAuthorAccountId(Long authorAccountId);
}
