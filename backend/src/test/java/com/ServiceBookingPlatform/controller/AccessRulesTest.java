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
import com.ServiceBookingPlatform.entity.ServiceEntity;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.repository.AccountRepository;
import com.ServiceBookingPlatform.service.AccountService;
import com.ServiceBookingPlatform.service.AppointmentService;
import com.ServiceBookingPlatform.service.OperatingHoursService;
import com.ServiceBookingPlatform.service.ReviewService;
import com.ServiceBookingPlatform.service.ServiceCatalogService;
import com.ServiceBookingPlatform.service.SlotCalculatorService;
import com.ServiceBookingPlatform.service.TenantService;
import com.ServiceBookingPlatform.service.TokenService;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        AppointmentController.class, ServiceController.class, OperatingHoursController.class,
        TenantController.class, ReviewController.class, AdminController.class, AuthController.class,
        SlotController.class})
@Import({SecurityConfig.class, LocalAuthConfig.class, WebConfig.class, CurrentUserArgumentResolver.class,
        OwnerGuard.class, AdminGuard.class, AccountService.class, TokenService.class})
@TestPropertySource(properties = {
        "app.auth.mode=local",
        "app.auth.local.secret=test-secret-test-secret-test-secret-123",
        "app.admin.emails=boss@torni.test"})
class AccessRulesTest {

    private static final String SECRET = "test-secret-test-secret-test-secret-123";
    private static final String TENANT = "X-Tenant-ID";

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

    @BeforeEach
    void tenantOneExists() {
        when(publicJdbcTemplate.queryForList(any(String.class), eq(String.class), anyLong()))
                .thenReturn(List.of("tenant_1"));
    }

    private AccountEntity account(long id, String identity, String type) {
        return AccountEntity.builder().id(id).identity(identity).name("Test").accountType(type)
                .passwordHash("x").createdAt(LocalDateTime.now()).build();
    }

    private String bearer(AccountEntity account) {
        return "Bearer " + tokenService.issue(account);
    }

    private String owner() {
        return bearer(account(7, "owner@torni.test", "business"));
    }

    @Test
    void ownerEndpointsRejectCallersWithoutAToken() throws Exception {
        mockMvc.perform(get("/api/v1/appointments").header(TENANT, "1")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/services").header(TENANT, "1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Cut\",\"durationMinutes\":30,\"price\":10}")).andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/v1/operating-hours").header(TENANT, "1").contentType(MediaType.APPLICATION_JSON)
                .content("[]")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/tenants/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/appointments/me").header(TENANT, "1")).andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/v1/appointments/1/status").header(TENANT, "1")
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/admin/tenants")).andExpect(status().isUnauthorized());
    }

    @Test
    void ownerEndpointsRejectSomeoneWhoDoesNotOwnTheTenant() throws Exception {
        when(tenantService.isOwner(1L, "local|7")).thenReturn(false);

        mockMvc.perform(get("/api/v1/appointments").header(TENANT, "1").header("Authorization", owner()))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/services").header(TENANT, "1").header("Authorization", owner())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Cut\",\"durationMinutes\":30,\"price\":10}")).andExpect(status().isForbidden());
        mockMvc.perform(put("/api/v1/operating-hours").header(TENANT, "1").header("Authorization", owner())
                .contentType(MediaType.APPLICATION_JSON).content("[]")).andExpect(status().isForbidden());
    }

    @Test
    void theOwnerOfTheTenantIsAllowed() throws Exception {
        when(tenantService.isOwner(1L, "local|7")).thenReturn(true);
        when(appointmentService.getAppointments(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/appointments").header(TENANT, "1").header("Authorization", owner()))
                .andExpect(status().isOk());
    }

    @Test
    void ownershipIsCheckedAgainstTheTenantInTheHeader() throws Exception {
        when(tenantService.isOwner(1L, "local|7")).thenReturn(true);
        when(tenantService.isOwner(2L, "local|7")).thenReturn(false);
        when(publicJdbcTemplate.queryForList(any(String.class), eq(String.class), eq(2L)))
                .thenReturn(List.of("tenant_2"));

        mockMvc.perform(get("/api/v1/appointments").header(TENANT, "2").header("Authorization", owner()))
                .andExpect(status().isForbidden());
    }

    @Test
    void storePagesStayPublic() throws Exception {
        when(serviceCatalogService.getAllServices()).thenReturn(List.of());
        when(operatingHoursService.getHours(1L)).thenReturn(List.of());
        TenantEntity tenant = TenantEntity.builder().id(1L).slug("shop").name("Shop").schemaName("tenant_1")
                .ownerAuth0Id("local|7").createdAt(LocalDateTime.now()).build();
        when(tenantService.getTenantBySlug("shop")).thenReturn(tenant);
        when(tenantService.listAllTenants()).thenReturn(List.of(tenant));

        mockMvc.perform(get("/api/v1/services").header(TENANT, "1")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/operating-hours").header(TENANT, "1")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/tenants/shop")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/tenants")).andExpect(status().isOk());
    }

    @Test
    void aGuestCanBookWithoutAnAccount() throws Exception {
        AppointmentEntity saved = AppointmentEntity.builder().id(5L).serviceId(1L).clientName("Guest")
                .clientPhone("333").startTime(LocalDateTime.now()).endTime(LocalDateTime.now())
                .status(AppointmentStatus.PENDING).build();
        when(appointmentService.book(any(), eq(null))).thenReturn(AppointmentResponse.from(saved));

        mockMvc.perform(post("/api/v1/appointments").header(TENANT, "1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"serviceId\":1,\"clientName\":\"Guest\",\"clientPhone\":\"333\",\"startTime\":\"2030-01-01T10:00:00\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void aSignedInBookingIsTiedToTheTokenSubjectNotTheBody() throws Exception {
        AppointmentEntity saved = AppointmentEntity.builder().id(5L).serviceId(1L).clientName("Ann")
                .clientPhone("333").startTime(LocalDateTime.now()).endTime(LocalDateTime.now())
                .status(AppointmentStatus.PENDING).build();
        when(appointmentService.book(any(), eq("local|9"))).thenReturn(AppointmentResponse.from(saved));

        mockMvc.perform(post("/api/v1/appointments").header(TENANT, "1")
                .header("Authorization", bearer(account(9, "ann@torni.test", "consumer")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"serviceId\":1,\"clientName\":\"Ann\",\"clientPhone\":\"333\",\"startTime\":\"2030-01-01T10:00:00\",\"clientAuth0Sub\":\"local|1\"}"))
                .andExpect(status().isCreated());
        verify(appointmentService).book(any(), eq("local|9"));
    }

    @Test
    void aReviewCannotClaimAnotherUsersIdentity() throws Exception {
        mockMvc.perform(post("/api/v1/reviews").header(TENANT, "1")
                .header("Authorization", bearer(account(9, "ann@torni.test", "consumer")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"rating\":5,\"authorName\":\"Ann\",\"authorAuth0Sub\":\"local|1\"}"))
                .andExpect(status().isCreated());
        verify(reviewService).submit(any(), eq("local|9"));
    }

    @Test
    void onlyBusinessAccountsCanCreateAStore() throws Exception {
        mockMvc.perform(post("/api/v1/tenants").header("Authorization", bearer(account(9, "ann@torni.test", "consumer")))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"My shop\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void onlyConfiguredAdminEmailsReachTheAdminPanel() throws Exception {
        when(tenantService.listAllTenants()).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/admin/tenants").header("Authorization", owner()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/tenants")
                .header("Authorization", bearer(account(1, "boss@torni.test", "business"))))
                .andExpect(status().isOk());
    }

    @Test
    void aTokenSignedWithAnotherKeyIsRejectedEvenOnPublicRoutes() throws Exception {
        NimbusJwtEncoder forger = new NimbusJwtEncoder(new ImmutableSecret<>(
                new SecretKeySpec("another-secret-another-secret-123456".getBytes(StandardCharsets.UTF_8), "HmacSHA256")));
        Instant now = Instant.now();
        String forged = forger.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),
                JwtClaimsSet.builder().issuer(LocalAuthConfig.ISSUER).subject("local|7")
                        .issuedAt(now).expiresAt(now.plusSeconds(600)).build())).getTokenValue();

        mockMvc.perform(get("/api/v1/services").header(TENANT, "1").header("Authorization", "Bearer " + forged))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void anExpiredTokenIsRejected() throws Exception {
        NimbusJwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(
                new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256")));
        Instant past = Instant.now().minusSeconds(3600);
        String expired = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),
                JwtClaimsSet.builder().issuer(LocalAuthConfig.ISSUER).subject("local|7")
                        .issuedAt(past.minusSeconds(60)).expiresAt(past).build())).getTokenValue();

        mockMvc.perform(get("/api/v1/tenants/me").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loggingInReturnsATokenThatUnlocksTheOwnerRoutes() throws Exception {
        AccountEntity stored = account(7, "owner@torni.test", "business");
        stored.setPasswordHash(new BCryptPasswordEncoder().encode("secret1"));
        when(accountRepository.findByIdentity("owner@torni.test")).thenReturn(Optional.of(stored));
        when(tenantService.isOwner(1L, "local|7")).thenReturn(true);
        when(appointmentService.getAppointments(any())).thenReturn(List.of());

        MvcResult login = mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"identity\":\"Owner@Torni.test\",\"password\":\"secret1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountType").value("business"))
                .andReturn();
        String body = login.getResponse().getContentAsString();
        String token = body.replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
        assertTrue(token.split("\\.").length == 3, "login should return a JWT");

        mockMvc.perform(get("/api/v1/appointments").header(TENANT, "1").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void aWrongPasswordIsRejectedAndSignupRejectsDuplicates() throws Exception {
        AccountEntity stored = account(7, "owner@torni.test", "business");
        stored.setPasswordHash(new BCryptPasswordEncoder().encode("secret1"));
        when(accountRepository.findByIdentity("owner@torni.test")).thenReturn(Optional.of(stored));

        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"identity\":\"owner@torni.test\",\"password\":\"nope-nope\"}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("WRONG_PASSWORD"));
        mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                .content("{\"identity\":\"owner@torni.test\",\"password\":\"secret1\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void profileUpdatesNeedALoginAndUseTheTokenIdentity() throws Exception {
        mockMvc.perform(put("/api/v1/auth/profile").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"X\",\"phone\":\"1\"}")).andExpect(status().isUnauthorized());

        AccountEntity stored = account(9, "ann@torni.test", "consumer");
        when(accountRepository.findById(9L)).thenReturn(Optional.of(stored));
        when(accountRepository.save(any(AccountEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        mockMvc.perform(put("/api/v1/auth/profile").header("Authorization", bearer(stored))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Ann B\",\"phone\":\"+39 333 1\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Ann B"))
                .andExpect(jsonPath("$.phone").value("393331"));
    }
}
