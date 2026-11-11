package com.ServiceBookingPlatform.config;

import com.ServiceBookingPlatform.exception.ForbiddenException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AdminGuardTest {

    private static AdminGuard guardWith(String csv) {
        AdminGuard guard = new AdminGuard();
        ReflectionTestUtils.setField(guard, "adminEmailsCsv", csv);
        return guard;
    }

    private static AuthenticatedUser user(String email) {
        return new AuthenticatedUser("local|1", email, null, "business");
    }

    @Test
    void listedEmailsPassWithWhitespaceIgnored() {
        AdminGuard guard = guardWith(" boss@torni.test , second@torni.test ");

        assertDoesNotThrow(() -> guard.assertAdmin(user("boss@torni.test")));
        assertDoesNotThrow(() -> guard.assertAdmin(user("second@torni.test")));
    }

    @Test
    void unlistedMissingOrAnonymousCallersAreRefused() {
        AdminGuard guard = guardWith("boss@torni.test");

        assertThrows(ForbiddenException.class, () -> guard.assertAdmin(user("other@torni.test")));
        assertThrows(ForbiddenException.class, () -> guard.assertAdmin(user(null)));
        assertThrows(ForbiddenException.class, () -> guard.assertAdmin(null));
    }

    @Test
    void nobodyIsAdminWhenTheListIsEmpty() {
        assertThrows(ForbiddenException.class, () -> guardWith("").assertAdmin(user("boss@torni.test")));
        assertThrows(ForbiddenException.class, () -> guardWith("").assertAdmin(user("")));
    }
}
