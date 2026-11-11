package com.ServiceBookingPlatform.filter;

import com.ServiceBookingPlatform.multitenancy.TenantContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Component
@Order(1)
public class TenantRoutingFilter extends OncePerRequestFilter {

    private static final String TENANT_HEADER = "X-Tenant-ID";

    // Inject publicJdbcTemplate directly — never goes through the routing DataSource.
    private final JdbcTemplate publicJdbcTemplate;

    public TenantRoutingFilter(@Qualifier("publicJdbcTemplate") JdbcTemplate publicJdbcTemplate) {
        this.publicJdbcTemplate = publicJdbcTemplate;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {
        try {
            if (requiresTenantContext(request)) {
                String tenantHeader = request.getHeader(TENANT_HEADER);
                if (tenantHeader == null || tenantHeader.isBlank()) {
                    writeErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST,
                            "TENANT_REQUIRED", "X-Tenant-ID header is missing");
                    return;
                }
                Long tenantId;
                try {
                    tenantId = Long.parseLong(tenantHeader);
                } catch (NumberFormatException e) {
                    writeErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST,
                            "TENANT_REQUIRED", "X-Tenant-ID must be a number");
                    return;
                }
                // Validate tenant exists and is enabled, and get its schema name.
                // Uses publicJdbcTemplate so this query always hits public.tenants.
                List<Map<String, Object>> rows = publicJdbcTemplate.queryForList(
                        "SELECT schema_name, enabled FROM tenants WHERE id = ?", tenantId);
                if (rows.isEmpty()) {
                    writeErrorResponse(response, HttpServletResponse.SC_BAD_REQUEST,
                            "TENANT_REQUIRED", "Tenant not found: " + tenantId);
                    return;
                }
                if (!Boolean.TRUE.equals(rows.get(0).get("enabled"))) {
                    writeErrorResponse(response, HttpServletResponse.SC_FORBIDDEN,
                            "TENANT_DISABLED", "This store is disabled");
                    return;
                }
                TenantContextHolder.setCurrentSchema((String) rows.get(0).get("schema_name"));
            }
            chain.doFilter(request, response);
        } finally {
            TenantContextHolder.clear();
        }
    }

    // Returns true for all /api/v1/** requests EXCEPT /api/v1/tenants/**, /api/v1/admin/** and /api/v1/auth/**
    private boolean requiresTenantContext(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/api/v1/")
                && !path.startsWith("/api/v1/tenants")
                && !path.startsWith("/api/v1/admin")
                && !path.startsWith("/api/v1/auth");
    }

    private void writeErrorResponse(HttpServletResponse response, int status,
                                    String error, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"error\":\"" + error + "\",\"message\":\"" + message + "\"}");
    }
}
