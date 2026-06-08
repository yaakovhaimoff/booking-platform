package com.ServiceBookingPlatform.multitenancy;

public class TenantContextHolder {
    private static final ThreadLocal<String> CURRENT_SCHEMA = new ThreadLocal<>();

    public static void setCurrentSchema(String schema) {
        CURRENT_SCHEMA.set(schema);
    }

    public static String getCurrentSchema() {
        return CURRENT_SCHEMA.get();
    }

    public static Long getTenantId() {
        String schema = getCurrentSchema();
        if (schema == null) return null;
        return Long.parseLong(schema.substring("tenant_".length()));
    }

    public static void clear() {
        CURRENT_SCHEMA.remove();
    }
}
