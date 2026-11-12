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

    private static AuthenticatedUser user(String subject, Long accountId) {
        return new AuthenticatedUser(subject, null, null, "business", null, accountId);
    }

    @Test
    void theOwnerOfTheCurrentTenantPasses() {
        AuthenticatedUser owner = user("local|7", 7L);
        when(tenantService.isOwner(5L, owner)).thenReturn(true);

        assertDoesNotThrow(() -> guard.assertOwnsCurrentTenant(owner));
    }

    @Test
    void anotherUserIsRefused() {
        AuthenticatedUser stranger = user("local|8", 8L);
        when(tenantService.isOwner(5L, stranger)).thenReturn(false);

        assertThrows(ForbiddenException.class, () -> guard.assertOwnsCurrentTenant(stranger));
    }

    @Test
    void aCallerWithoutAnAccountIdIsPassedOnSoTheShopCanApplyItsOwnFallbackRule() {
        AuthenticatedUser withoutAccount = user("dev|owner1", null);
        when(tenantService.isOwner(5L, withoutAccount)).thenReturn(true);

        assertDoesNotThrow(() -> guard.assertOwnsCurrentTenant(withoutAccount));
    }

    @Test
    void noUserIsRefused() {
        assertThrows(ForbiddenException.class, () -> guard.assertOwnsCurrentTenant(null));
    }

    @Test
    void noTenantContextIsRefused() {
        TenantContextHolder.clear();

        assertThrows(ForbiddenException.class, () -> guard.assertOwnsCurrentTenant(user("local|7", 7L)));
    }
}
