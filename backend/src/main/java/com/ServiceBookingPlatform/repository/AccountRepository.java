package com.ServiceBookingPlatform.repository;

import com.ServiceBookingPlatform.entity.AccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<AccountEntity, Long> {
    Optional<AccountEntity> findByIdentity(String identity);

    Optional<AccountEntity> findByAuthSubject(String authSubject);
}
