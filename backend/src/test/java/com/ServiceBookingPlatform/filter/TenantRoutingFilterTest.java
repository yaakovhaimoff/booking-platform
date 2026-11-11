package com.ServiceBookingPlatform.filter;

import com.ServiceBookingPlatform.multitenancy.TenantContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class TenantRoutingFilterTest {

    private JdbcTemplate jdbcTemplate;
    private TenantRoutingFilter filter;
    private FilterChain chain;

    @BeforeEach
    void setUp() {
        jdbcTemplate = mock(JdbcTemplate.class);
        filter = new TenantRoutingFilter(jdbcTemplate);
        chain = mock(FilterChain.class);
    }

    @AfterEach
    void clearContext() {
        TenantContextHolder.clear();
    }

    private MockHttpServletRequest request(String path, String tenantHeader) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        request.setRequestURI(path);
        if (tenantHeader != null) {
            request.addHeader("X-Tenant-ID", tenantHeader);
        }
        return request;
    }

    private void tenantRow(long id, String schema, boolean enabled) {
        when(jdbcTemplate.queryForList(any(String.class), eq(id)))
                .thenReturn(List.of(Map.of("schema_name", schema, "enabled", enabled)));
    }

    @Test
    void anEnabledTenantIsRoutedToItsSchemaDuringTheRequestOnly() throws ServletException, IOException {
        tenantRow(7, "tenant_7", true);
        AtomicReference<String> schemaSeenByController = new AtomicReference<>();
        FilterChain capturing = (req, res) -> schemaSeenByController.set(TenantContextHolder.getCurrentSchema());

        filter.doFilter(request("/api/v1/services", "7"), new MockHttpServletResponse(), capturing);

        assertEquals("tenant_7", schemaSeenByController.get());
        assertNull(TenantContextHolder.getCurrentSchema(), "the tenant must not leak to the next request on this thread");
    }

    @Test
    void aDisabledTenantIsRefusedWithoutTouchingTheController() throws ServletException, IOException {
        tenantRow(7, "tenant_7", false);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request("/api/v1/appointments", "7"), response, chain);

        assertEquals(403, response.getStatus());
        assertTrue(response.getContentAsString().contains("TENANT_DISABLED"));
        verifyNoInteractions(chain);
        assertNull(TenantContextHolder.getCurrentSchema());
    }

    @Test
    void anUnknownTenantIsRefused() throws ServletException, IOException {
        when(jdbcTemplate.queryForList(any(String.class), eq(99L))).thenReturn(List.of());
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request("/api/v1/services", "99"), response, chain);

        assertEquals(400, response.getStatus());
        assertTrue(response.getContentAsString().contains("TENANT_REQUIRED"));
        verifyNoInteractions(chain);
    }

    @Test
    void aMissingOrNonNumericTenantHeaderIsRefused() throws ServletException, IOException {
        MockHttpServletResponse missing = new MockHttpServletResponse();
        filter.doFilter(request("/api/v1/services", null), missing, chain);
        MockHttpServletResponse blank = new MockHttpServletResponse();
        filter.doFilter(request("/api/v1/services", "  "), blank, chain);
        MockHttpServletResponse text = new MockHttpServletResponse();
        filter.doFilter(request("/api/v1/services", "abc"), text, chain);

        assertEquals(400, missing.getStatus());
        assertEquals(400, blank.getStatus());
        assertEquals(400, text.getStatus());
        verifyNoInteractions(chain);
        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    void routesThatAreNotTenantScopedSkipTheLookup() throws ServletException, IOException {
        for (String path : List.of("/api/v1/tenants", "/api/v1/tenants/my-shop", "/api/v1/admin/tenants", "/api/v1/auth/login", "/error")) {
            filter.doFilter(request(path, null), new MockHttpServletResponse(), chain);
        }

        verify(chain, times(5)).doFilter(any(), any());
        verifyNoInteractions(jdbcTemplate);
    }

    @Test
    void theTenantIsClearedEvenWhenTheControllerFails() {
        tenantRow(7, "tenant_7", true);
        FilterChain failing = (req, res) -> { throw new ServletException("boom"); };

        assertThrows(ServletException.class,
                () -> filter.doFilter(request("/api/v1/services", "7"), new MockHttpServletResponse(), failing));

        assertNull(TenantContextHolder.getCurrentSchema());
    }

    @Test
    void aFailedLookupDoesNotLeaveTheTenantOfAnEarlierRequestBehind() throws ServletException, IOException {
        tenantRow(7, "tenant_7", true);
        filter.doFilter(request("/api/v1/services", "7"), new MockHttpServletResponse(), chain);
        when(jdbcTemplate.queryForList(any(String.class), eq(8L))).thenReturn(List.of());

        filter.doFilter(request("/api/v1/services", "8"), new MockHttpServletResponse(), chain);

        assertNull(TenantContextHolder.getCurrentSchema());
    }
}
