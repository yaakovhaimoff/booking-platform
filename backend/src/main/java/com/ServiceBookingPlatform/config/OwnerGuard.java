package com.ServiceBookingPlatform.config;

import com.ServiceBookingPlatform.exception.ForbiddenException;
import com.ServiceBookingPlatform.multitenancy.TenantContextHolder;
import com.ServiceBookingPlatform.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Confirms the caller owns the tenant named by the X-Tenant-ID header, for every owner-only route. */
@Component
@RequiredArgsConstructor
public class OwnerGuard {

    private final TenantService tenantService;

    public void assertOwnsCurrentTenant(AuthenticatedUser user) {
        Long tenantId = TenantContextHolder.getTenantId();
        if (user == null || tenantId == null || !tenantService.isOwner(tenantId, user)) {
            throw new ForbiddenException("You do not own this store");
        }
    }
}
