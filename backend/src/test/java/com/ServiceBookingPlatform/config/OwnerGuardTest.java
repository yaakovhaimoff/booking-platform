package com.ServiceBookingPlatform.config;

import com.ServiceBookingPlatform.exception.ForbiddenException;
import com.ServiceBookingPlatform.multitenancy.TenantContextHolder;
import com.ServiceBookingPlatform.service.TenantService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OwnerGuardTest {

    private TenantService tenantService;
    private OwnerGuard guard;

    @BeforeEach
    void setUp() {
        tenantService = mock(TenantService.class);
        guard = new OwnerGuard(tenantService);
        TenantContextHolder.setCurrentSchema("tenant_5");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private static AuthenticatedUser user(String subject) {
        return new AuthenticatedUser(subject, null, null, "business");
    }

    @Test
    void theOwnerOfTheCurrentTenantPasses() {
        when(tenantService.isOwner(5L, "local|7")).thenReturn(true);

        assertDoesNotThrow(() -> guard.assertOwnsCurrentTenant(user("local|7")));
    }

    @Test
    void anotherUserIsRefused() {
        when(tenantService.isOwner(5L, "local|8")).thenReturn(false);

        assertThrows(ForbiddenException.class, () -> guard.assertOwnsCurrentTenant(user("local|8")));
    }

    @Test
    void noUserIsRefused() {
        assertThrows(ForbiddenException.class, () -> guard.assertOwnsCurrentTenant(null));
    }

    @Test
    void noTenantContextIsRefused() {
        TenantContextHolder.clear();

        assertThrows(ForbiddenException.class, () -> guard.assertOwnsCurrentTenant(user("local|7")));
    }
}
