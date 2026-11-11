package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.AppointmentStatus;
import com.ServiceBookingPlatform.entity.ServiceEntity;
import com.ServiceBookingPlatform.entity.TenantEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.CompletableFuture;

/**
 * Always logs. Additionally emails the business owner through Resend (https://resend.com)
 * when RESEND_API_KEY is set. Customers are not contacted yet: checkout collects no email,
 * only a phone number, so that needs an SMS/WhatsApp provider (see ROADMAP G18).
 */
@Slf4j
@Service
public class DefaultNotificationService implements NotificationService {

    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("EEE d MMM, HH:mm");

    @Value("${app.notifications.resend-api-key:}")
    private String apiKey;

    @Value("${app.notifications.from:torni <onboarding@resend.dev>}")
    private String from;

    @Value("${app.public-url:http://localhost:5173}")
    private String publicUrl;

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @Override
    public void bookingCreated(TenantEntity tenant, AppointmentEntity a, ServiceEntity service) {
        log.info("[NOTIFY] new booking tenant={} appt={} -> owner", tenant.getId(), a.getId());
        boolean it = isItalian(tenant);
        String when = a.getStartTime().format(WHEN);
        String subject = it ? "Nuova richiesta di prenotazione" : "New booking request";
        String body = (it ? "<p>Hai una nuova richiesta in attesa di approvazione.</p>"
                          : "<p>You have a new request waiting for your approval.</p>")
                + "<p><b>" + esc(a.getClientName()) + "</b> · " + esc(a.getClientPhone()) + "<br>"
                + esc(service.getName()) + " · " + esc(when)
                + (a.getNotes() == null ? "" : "<br><i>" + esc(a.getNotes()) + "</i>") + "</p>"
                + "<p><a href=\"" + esc(publicUrl) + "/owner?tab=queue\">"
                + (it ? "Apri la dashboard" : "Open your dashboard") + "</a></p>";
        emailOwner(tenant, subject, body);
    }

    @Override
    public void statusChanged(TenantEntity tenant, AppointmentEntity a, boolean byOwner) {
        log.info("[NOTIFY] status tenant={} appt={} status={} byOwner={}", tenant.getId(), a.getId(), a.getStatus(), byOwner);
        if (!byOwner && a.getStatus() == AppointmentStatus.CANCELLED) {
            boolean it = isItalian(tenant);
            String when = a.getStartTime().format(WHEN);
            emailOwner(tenant,
                    it ? "Prenotazione annullata dal cliente" : "Booking cancelled by the customer",
                    "<p><b>" + esc(a.getClientName()) + "</b> · " + esc(when) + "</p>");
        }
    }

    private void emailOwner(TenantEntity tenant, String subject, String html) {
        String to = tenant.getOwnerEmail();
        if (apiKey == null || apiKey.isBlank()) return;
        if (to == null || !to.contains("@") || to.endsWith("@demo.local") || to.endsWith("@example.com")) return;
        String json = "{\"from\":" + q(from) + ",\"to\":[" + q(to) + "],\"subject\":" + q(subject) + ",\"html\":" + q(html) + "}";
        HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
                .timeout(Duration.ofSeconds(10))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();
        CompletableFuture.runAsync(() -> {
            try {
                HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
                if (res.statusCode() >= 300) log.warn("Email failed: {} {}", res.statusCode(), res.body());
            } catch (Exception e) {
                log.warn("Email failed: {}", e.toString());
            }
        });
    }

    private static boolean isItalian(TenantEntity t) {
        return t.getDefaultLanguage() == null || t.getDefaultLanguage().toLowerCase().startsWith("it");
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private static String q(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> { if (c < 0x20) sb.append(String.format("\\u%04x", (int) c)); else sb.append(c); }
            }
        }
        return sb.append('"').toString();
    }
}
