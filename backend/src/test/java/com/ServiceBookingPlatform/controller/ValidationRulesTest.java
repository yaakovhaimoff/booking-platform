package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.config.AdminGuard;
import com.ServiceBookingPlatform.config.CurrentUserArgumentResolver;
import com.ServiceBookingPlatform.config.LocalAuthConfig;
import com.ServiceBookingPlatform.config.OwnerGuard;
import com.ServiceBookingPlatform.config.SecurityConfig;
import com.ServiceBookingPlatform.config.WebConfig;
import com.ServiceBookingPlatform.dto.AppointmentResponse;
import com.ServiceBookingPlatform.entity.AccountEntity;
import com.ServiceBookingPlatform.entity.AppointmentEntity;
import com.ServiceBookingPlatform.entity.AppointmentStatus;
import com.ServiceBookingPlatform.service.AccountService;
import com.ServiceBookingPlatform.service.AppointmentService;
import com.ServiceBookingPlatform.service.OperatingHoursService;
import com.ServiceBookingPlatform.service.ReviewService;
import com.ServiceBookingPlatform.service.ServiceCatalogService;
import com.ServiceBookingPlatform.service.SlotCalculatorService;
import com.ServiceBookingPlatform.service.TenantService;
import com.ServiceBookingPlatform.service.TokenService;
import com.ServiceBookingPlatform.repository.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AppointmentController.class, ServiceController.class, ReviewController.class,
        OperatingHoursController.class, TenantController.class, AdminController.class, AuthController.class, SlotController.class})
@Import({SecurityConfig.class, LocalAuthConfig.class, WebConfig.class, CurrentUserArgumentResolver.class,
        OwnerGuard.class, AdminGuard.class, AccountService.class, TokenService.class})
@TestPropertySource(properties = {"app.auth.mode=local", "app.auth.local.secret=test-secret-test-secret-test-secret-123"})
class ValidationRulesTest {

    @Autowired MockMvc mockMvc;
    @Autowired TokenService tokenService;

    @MockitoBean TenantService tenantService;
    @MockitoBean AppointmentService appointmentService;
    @MockitoBean ServiceCatalogService serviceCatalogService;
    @MockitoBean OperatingHoursService operatingHoursService;
    @MockitoBean ReviewService reviewService;
    @MockitoBean SlotCalculatorService slotCalculatorService;
    @MockitoBean AccountRepository accountRepository;
    @MockitoBean(name = "publicJdbcTemplate") JdbcTemplate publicJdbcTemplate;

    private String ownerHeader;

    @BeforeEach
    void setUp() {
        when(publicJdbcTemplate.queryForList(any(String.class), eq(1L)))
                .thenReturn(List.of(Map.of("schema_name", "tenant_1", "enabled", true)));
        when(tenantService.isOwner(1L, "local|7")).thenReturn(true);
        AppointmentEntity saved = AppointmentEntity.builder().id(1L).serviceId(1L).clientName("A").clientPhone("123456")
                .startTime(LocalDateTime.now()).endTime(LocalDateTime.now()).status(AppointmentStatus.PENDING).build();
        when(appointmentService.book(any(), any())).thenReturn(AppointmentResponse.from(saved));
        ownerHeader = "Bearer " + tokenService.issue(AccountEntity.builder().id(7L).identity("o@torni.test")
                .accountType("business").build());
    }

    private ResultActions book(String phone) throws Exception {
        return mockMvc.perform(post("/api/v1/appointments").header("X-Tenant-ID", "1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"serviceId\":1,\"clientName\":\"Ann\",\"clientPhone\":\"" + phone
                        + "\",\"startTime\":\"2030-01-01T10:00:00\"}"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"123456", "1234567890", "123456789012345"})
    void phonesOfSixToFifteenDigitsAreAccepted(String phone) throws Exception {
        book(phone).andExpect(status().isCreated());
    }

    @ParameterizedTest
    @ValueSource(strings = {"12345", "1234567890123456", "12345a", "+393331234567", "12 345 678", "--------"})
    void otherPhonesAreRejectedWithAFieldError(String phone) throws Exception {
        book(phone).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fields.clientPhone").exists());
    }

    @Test
    void bookingNeedsNameAndNotesStayWithinTheColumn() throws Exception {
        String base = "{\"serviceId\":1,\"clientPhone\":\"123456\",\"startTime\":\"2030-01-01T10:00:00\"";
        mockMvc.perform(post("/api/v1/appointments").header("X-Tenant-ID", "1").contentType(MediaType.APPLICATION_JSON)
                .content(base + ",\"clientName\":\" \"}")).andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/appointments").header("X-Tenant-ID", "1").contentType(MediaType.APPLICATION_JSON)
                .content(base + ",\"clientName\":\"" + "n".repeat(101) + "\"}")).andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/appointments").header("X-Tenant-ID", "1").contentType(MediaType.APPLICATION_JSON)
                .content(base + ",\"clientName\":\"Ann\",\"notes\":\"" + "n".repeat(501) + "\"}")).andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/appointments").header("X-Tenant-ID", "1").contentType(MediaType.APPLICATION_JSON)
                .content(base + ",\"clientName\":\"Ann\",\"notes\":\"" + "n".repeat(500) + "\"}")).andExpect(status().isCreated());
    }

    private ResultActions createService(String name, String durationMinutes, String price) throws Exception {
        return mockMvc.perform(post("/api/v1/services").header("X-Tenant-ID", "1").header("Authorization", ownerHeader)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"" + name + "\",\"durationMinutes\":" + durationMinutes + ",\"price\":" + price + "}"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "0.00", "15", "15.5", "99999999.99"})
    void sensiblePricesAreAccepted(String price) throws Exception {
        createService("Cut", "30", price).andExpect(status().isCreated());
    }

    @ParameterizedTest
    @ValueSource(strings = {"null", "-0.01", "-5", "100000000", "10.999", "123456789012"})
    void pricesThatWouldBreakTheColumnAreRejected(String price) throws Exception {
        createService("Cut", "30", price).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.price").exists());
    }

    @ParameterizedTest
    @ValueSource(strings = {"1", "30", "1440"})
    void durationsFromOneMinuteToADayAreAccepted(String minutes) throws Exception {
        createService("Cut", minutes, "10").andExpect(status().isCreated());
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-30", "1441", "99999"})
    void otherDurationsAreRejected(String minutes) throws Exception {
        createService("Cut", minutes, "10").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields.durationMinutes").exists());
    }

    @Test
    void serviceNamesMustBePresentAndFitTheColumn() throws Exception {
        createService("", "30", "10").andExpect(status().isBadRequest());
        createService("n".repeat(101), "30", "10").andExpect(status().isBadRequest());
        createService("n".repeat(100), "30", "10").andExpect(status().isCreated());
    }

    @Test
    void updatingAServiceUsesTheSameRules() throws Exception {
        mockMvc.perform(put("/api/v1/services/1").header("X-Tenant-ID", "1").header("Authorization", ownerHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Cut\",\"durationMinutes\":5000,\"price\":10}"))
                .andExpect(status().isBadRequest());
    }

    private ResultActions review(String rating, String name, String comment) throws Exception {
        return mockMvc.perform(post("/api/v1/reviews").header("X-Tenant-ID", "1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":" + rating + ",\"authorName\":\"" + name + "\",\"comment\":\"" + comment + "\"}"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"1", "3", "5"})
    void ratingsOneToFiveAreAccepted(String rating) throws Exception {
        review(rating, "Ann", "ok").andExpect(status().isCreated());
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "6", "-1", "100"})
    void otherRatingsAreRejected(String rating) throws Exception {
        review(rating, "Ann", "ok").andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields.rating").exists());
    }

    @Test
    void reviewNameAndCommentMustFitTheirColumns() throws Exception {
        review("5", "", "ok").andExpect(status().isBadRequest());
        review("5", "n".repeat(101), "ok").andExpect(status().isBadRequest());
        review("5", "Ann", "c".repeat(1001)).andExpect(status().isBadRequest());
        review("5", "n".repeat(100), "c".repeat(1000)).andExpect(status().isCreated());
    }
}
