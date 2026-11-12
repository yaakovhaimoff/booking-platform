package com.ServiceBookingPlatform.integration;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assumptions.assumeTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Runs the whole application against a throw-away Postgres database and proves that two shops, their
 * owners and their customers cannot see or change each other's data. Skipped (not failed) when no local
 * Postgres is reachable. Connection settings come from DB_HOST, DB_PORT, DB_USER and DB_PASSWORD, with
 * the same defaults as application.properties.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TenantIsolationIntegrationTest {

    private static final String HOST = env("DB_HOST", "localhost");
    private static final String PORT = env("DB_PORT", "5432");
    private static final String USER = env("DB_USER", "admin");
    private static final String PASSWORD = env("DB_PASSWORD", "admin");
    private static final String SCRATCH_DATABASE = "isolation_test_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    private static final String ADMIN_EMAIL = "boss-" + UUID.randomUUID().toString().substring(0, 8) + "@torni.test";
    private static final String PASSWORD_FOR_ACCOUNTS = "secret1";
    private static final String TOMORROW = LocalDate.now().plusDays(1).toString();

    private static boolean databaseCreated;

    @Autowired MockMvc mockMvc;
    @Autowired @Qualifier("publicJdbcTemplate") JdbcTemplate publicJdbcTemplate;

    private static String env(String name, String fallback) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? fallback : value;
    }

    private static String url(String database) {
        return "jdbc:postgresql://" + HOST + ":" + PORT + "/" + database;
    }

    @BeforeAll
    static void createScratchDatabase() {
        try (Connection connection = DriverManager.getConnection(url("postgres"), USER, PASSWORD);
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE DATABASE " + SCRATCH_DATABASE);
            databaseCreated = true;
        } catch (Exception e) {
            databaseCreated = false;
        }
        assumeTrue(databaseCreated, "No local Postgres reachable: skipping the tenant isolation test");
    }

    @AfterAll
    static void dropScratchDatabase() {
        if (!databaseCreated) {
            return;
        }
        try (Connection connection = DriverManager.getConnection(url("postgres"), USER, PASSWORD);
             Statement statement = connection.createStatement()) {
            statement.execute("DROP DATABASE IF EXISTS " + SCRATCH_DATABASE + " WITH (FORCE)");
        } catch (Exception ignored) {
            // The scratch database name is random and unused elsewhere; a leftover is harmless.
        }
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> url(SCRATCH_DATABASE));
        registry.add("spring.datasource.username", () -> USER);
        registry.add("spring.datasource.password", () -> PASSWORD);
        registry.add("spring.jpa.show-sql", () -> "false");
        registry.add("app.auth.mode", () -> "local");
        registry.add("app.auth.local.secret", () -> "isolation-test-secret-isolation-test-1234");
        registry.add("app.admin.emails", () -> ADMIN_EMAIL);
    }

    private static String ownerAToken;
    private static String ownerBToken;
    private static String customerOneToken;
    private static String customerTwoToken;
    private static String adminToken;
    private static long shopA;
    private static long shopB;
    private static long serviceA;
    private static long serviceB;
    private static long appointmentA;
    private static long appointmentB;

    private String signUp(String identity, String accountType) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identity\":\"" + identity + "\",\"password\":\"" + PASSWORD_FOR_ACCOUNTS
                                + "\",\"name\":\"" + identity + "\",\"accountType\":\"" + accountType + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    private String signUpNamed(String identity, String accountType, String name) throws Exception {
        String body = mockMvc.perform(post("/api/v1/auth/signup").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"identity\":\"" + identity + "\",\"password\":\"" + PASSWORD_FOR_ACCOUNTS
                                + "\",\"name\":\"" + name + "\",\"accountType\":\"" + accountType + "\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    private String savePhone(String token, String name, String phone) throws Exception {
        String body = send(put("/api/v1/auth/profile"), token, null,
                "{\"name\":\"" + name + "\",\"phone\":\"" + phone + "\"}")
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.token");
    }

    private static String suffix() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private ResultActions send(MockHttpServletRequestBuilder builder, String token, Long shop, String json) throws Exception {
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        if (shop != null) {
            builder.header("X-Tenant-ID", shop);
        }
        if (json != null) {
            builder.contentType(MediaType.APPLICATION_JSON).content(json);
        }
        return mockMvc.perform(builder);
    }

    private long createShop(String token, String name) throws Exception {
        String body = send(post("/api/v1/tenants"), token, null, "{\"name\":\"" + name + "\"}")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private long createService(String token, long shop, String name) throws Exception {
        String body = send(post("/api/v1/services"), token, shop,
                "{\"name\":\"" + name + "\",\"durationMinutes\":30,\"price\":15}")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private long book(String token, long shop, long serviceId, String clientName, String time) throws Exception {
        String body = send(post("/api/v1/appointments"), token, shop,
                "{\"serviceId\":" + serviceId + ",\"clientName\":\"" + clientName
                        + "\",\"clientPhone\":\"3331112222\",\"startTime\":\"" + TOMORROW + "T" + time + "\"}")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private List<Integer> ids(String path, String token, long shop) throws Exception {
        String body = send(get(path), token, shop, null).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$[*].id");
    }

    private List<String> names(String path, String token, long shop, String jsonPath) throws Exception {
        String body = send(get(path), token, shop, null).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, jsonPath);
    }

    @Test
    @Order(1)
    void setUpTwoShopsWithOneBookingEach() throws Exception {
        String run = suffix();
        ownerAToken = signUp("owner-a-" + run + "@torni.test", "business");
        ownerBToken = signUp("owner-b-" + run + "@torni.test", "business");
        customerOneToken = signUp("customer-one-" + run + "@torni.test", "consumer");
        customerTwoToken = signUp("customer-two-" + run + "@torni.test", "consumer");
        adminToken = signUp(ADMIN_EMAIL, "business");

        shopA = createShop(ownerAToken, "Shop Alpha");
        shopB = createShop(ownerBToken, "Shop Beta");
        assertNotEquals(shopA, shopB);

        serviceA = createService(ownerAToken, shopA, "Alpha Haircut");
        serviceB = createService(ownerBToken, shopB, "Beta Haircut");
        appointmentA = book(null, shopA, serviceA, "Guest of Alpha", "10:00:00");
        appointmentB = book(null, shopB, serviceB, "Guest of Beta", "10:00:00");
    }

    @Test
    @Order(2)
    void eachShopHasItsOwnPhysicalSchemaWithItsOwnRows() {
        String schemaA = "tenant_" + shopA;
        String schemaB = "tenant_" + shopB;

        assertEquals(1, publicJdbcTemplate.queryForObject("SELECT count(*) FROM " + schemaA + ".appointments", Integer.class));
        assertEquals(1, publicJdbcTemplate.queryForObject("SELECT count(*) FROM " + schemaB + ".appointments", Integer.class));
        assertEquals("Guest of Alpha", publicJdbcTemplate.queryForObject(
                "SELECT client_name FROM " + schemaA + ".appointments", String.class));
        assertEquals("Guest of Beta", publicJdbcTemplate.queryForObject(
                "SELECT client_name FROM " + schemaB + ".appointments", String.class));
        assertEquals("Alpha Haircut", publicJdbcTemplate.queryForObject(
                "SELECT name FROM " + schemaA + ".services", String.class));
        assertEquals("Beta Haircut", publicJdbcTemplate.queryForObject(
                "SELECT name FROM " + schemaB + ".services", String.class));
    }

    @Test
    @Order(3)
    void eachShopOnlyServesItsOwnServicesAndAppointments() throws Exception {
        assertEquals(List.of("Alpha Haircut"), names("/api/v1/services", null, shopA, "$[*].name"));
        assertEquals(List.of("Beta Haircut"), names("/api/v1/services", null, shopB, "$[*].name"));
        assertEquals(List.of("Guest of Alpha"), names("/api/v1/appointments", ownerAToken, shopA, "$[*].clientName"));
        assertEquals(List.of("Guest of Beta"), names("/api/v1/appointments", ownerBToken, shopB, "$[*].clientName"));
    }

    @Test
    @Order(4)
    void aSlotBookedInOneShopStaysFreeInTheOther() throws Exception {
        String slotsInA = send(get("/api/v1/slots?date=" + TOMORROW + "&serviceId=" + serviceA), null, shopA, null)
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String slotsInB = send(get("/api/v1/slots?date=" + TOMORROW + "&serviceId=" + serviceB), null, shopB, null)
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

        // Both shops booked 10:00 tomorrow, and each only lost its own 10:00.
        assertEquals(false, ((List<?>) JsonPath.read(slotsInA, "$")).contains(TOMORROW + "T10:00:00"));
        assertEquals(false, ((List<?>) JsonPath.read(slotsInB, "$")).contains(TOMORROW + "T10:00:00"));
        send(post("/api/v1/appointments"), null, shopA,
                "{\"serviceId\":" + serviceA + ",\"clientName\":\"Again\",\"clientPhone\":\"3331112222\",\"startTime\":\"" + TOMORROW + "T10:00:00\"}")
                .andExpect(status().isConflict());
        send(post("/api/v1/appointments"), null, shopA,
                "{\"serviceId\":" + serviceA + ",\"clientName\":\"Later\",\"clientPhone\":\"3331112222\",\"startTime\":\"" + TOMORROW + "T11:00:00\"}")
                .andExpect(status().isCreated());
    }

    @Test
    @Order(5)
    void anOwnerCannotTouchAnotherShopsData() throws Exception {
        send(get("/api/v1/appointments"), ownerAToken, shopB, null).andExpect(status().isForbidden());
        send(get("/api/v1/appointments?status=PENDING"), ownerBToken, shopA, null).andExpect(status().isForbidden());
        send(post("/api/v1/services"), ownerAToken, shopB,
                "{\"name\":\"Planted\",\"durationMinutes\":30,\"price\":1}").andExpect(status().isForbidden());
        send(put("/api/v1/services/" + serviceB), ownerAToken, shopB,
                "{\"name\":\"Hijacked\",\"durationMinutes\":30,\"price\":1}").andExpect(status().isForbidden());
        send(delete("/api/v1/services/" + serviceB), ownerAToken, shopB, null).andExpect(status().isForbidden());
        send(put("/api/v1/operating-hours"), ownerAToken, shopB, "[]").andExpect(status().isForbidden());
        send(patch("/api/v1/appointments/" + appointmentB + "/status"), ownerAToken, shopB,
                "{\"status\":\"CANCELLED\"}").andExpect(status().isForbidden());

        assertEquals(List.of("Beta Haircut"), names("/api/v1/services", null, shopB, "$[*].name"));
        send(get("/api/v1/appointments"), ownerBToken, shopB, null)
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    @Order(6)
    void idsThatExistOnlyInAnotherShopAreNotFoundAndNothingChanges() throws Exception {
        long extraServiceInB = createService(ownerBToken, shopB, "Beta Color");
        book(null, shopB, serviceB, "Beta extra one", "15:00:00");
        book(null, shopB, serviceB, "Beta extra two", "15:30:00");
        long highestAppointmentInB = book(null, shopB, serviceB, "Beta extra three", "16:00:00");
        assertEquals(true, highestAppointmentInB > 2, "shop B must have an id that shop A does not have");

        send(delete("/api/v1/services/" + extraServiceInB), ownerAToken, shopA, null).andExpect(status().isNotFound());
        send(put("/api/v1/services/" + extraServiceInB), ownerAToken, shopA,
                "{\"name\":\"Hijacked\",\"durationMinutes\":30,\"price\":1}").andExpect(status().isNotFound());
        send(patch("/api/v1/appointments/" + highestAppointmentInB + "/status"), ownerAToken, shopA,
                "{\"status\":\"CANCELLED\"}").andExpect(status().isNotFound());

        assertEquals(List.of("Beta Haircut", "Beta Color"), names("/api/v1/services", null, shopB, "$[*].name"));
        send(get("/api/v1/appointments?status=CANCELLED"), ownerBToken, shopB, null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @Order(7)
    void theSameNumericIdInTwoShopsIsTwoDifferentRowsAndActionsStayInTheCallersShop() throws Exception {
        assertEquals(appointmentA, appointmentB, "ids restart in every shop, so these are the same number");
        assertEquals(serviceA, serviceB);

        send(patch("/api/v1/appointments/" + appointmentA + "/status"), ownerAToken, shopA,
                "{\"status\":\"CANCELLED\"}").andExpect(status().isOk());

        send(get("/api/v1/appointments?status=CANCELLED"), ownerAToken, shopA, null)
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].clientName").value("Guest of Alpha"));
        send(get("/api/v1/appointments?status=CANCELLED"), ownerBToken, shopB, null)
                .andExpect(jsonPath("$.length()").value(0));
        assertEquals("PENDING", publicJdbcTemplate.queryForObject(
                "SELECT status FROM tenant_" + shopB + ".appointments WHERE id = ?", String.class, appointmentB));
        assertEquals("CANCELLED", publicJdbcTemplate.queryForObject(
                "SELECT status FROM tenant_" + shopA + ".appointments WHERE id = ?", String.class, appointmentA));
    }

    @Test
    @Order(8)
    void profileEditsOnlyChangeTheCallersOwnShop() throws Exception {
        send(put("/api/v1/tenants/me"), ownerAToken, null, "{\"name\":\"Shop Alpha Renamed\"}").andExpect(status().isOk());

        send(get("/api/v1/tenants/me"), ownerAToken, null, null).andExpect(jsonPath("$.name").value("Shop Alpha Renamed"));
        send(get("/api/v1/tenants/me"), ownerBToken, null, null).andExpect(jsonPath("$.name").value("Shop Beta"));
    }

    @Test
    @Order(9)
    void customersOnlySeeAndCancelTheirOwnBookingsPerShop() throws Exception {
        long oneInA = book(customerOneToken, shopA, serviceA, "Customer One", "13:00:00");
        long oneInB = book(customerOneToken, shopB, serviceB, "Customer One", "13:00:00");
        book(customerTwoToken, shopA, serviceA, "Customer Two", "14:00:00");

        assertEquals(List.of("Customer One"), names("/api/v1/appointments/me", customerOneToken, shopA, "$[*].clientName"));
        assertEquals(List.of("Customer One"), names("/api/v1/appointments/me", customerOneToken, shopB, "$[*].clientName"));
        assertEquals(List.of("Customer Two"), names("/api/v1/appointments/me", customerTwoToken, shopA, "$[*].clientName"));
        assertEquals(List.of(), names("/api/v1/appointments/me", customerTwoToken, shopB, "$[*].clientName"));

        send(patch("/api/v1/appointments/" + oneInA + "/status"), customerTwoToken, shopA,
                "{\"status\":\"CANCELLED\"}").andExpect(status().isForbidden());
        send(patch("/api/v1/appointments/" + oneInB + "/status"), customerOneToken, shopB,
                "{\"status\":\"CANCELLED\"}").andExpect(status().isOk());
        send(get("/api/v1/appointments/me"), customerOneToken, shopA, null)
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    @Order(10)
    void reviewsBelongToOneShopAndReplaceOnlyWithinThatShop() throws Exception {
        String review = "{\"rating\":5,\"authorName\":\"Customer One\",\"comment\":\"great\"}";
        send(post("/api/v1/reviews"), customerOneToken, shopA, review).andExpect(status().isCreated());
        send(post("/api/v1/reviews"), customerOneToken, shopB, "{\"rating\":1,\"authorName\":\"Customer One\"}")
                .andExpect(status().isCreated());
        send(post("/api/v1/reviews"), customerOneToken, shopA, "{\"rating\":4,\"authorName\":\"Customer One\"}")
                .andExpect(status().isCreated());

        send(get("/api/v1/reviews"), null, shopA, null)
                .andExpect(jsonPath("$.count").value(1)).andExpect(jsonPath("$.average").value(4.0));
        send(get("/api/v1/reviews"), null, shopB, null)
                .andExpect(jsonPath("$.count").value(1)).andExpect(jsonPath("$.average").value(1.0));
    }

    @Test
    @Order(11)
    void aDisabledShopRefusesEveryTenantRequestAndOtherShopsKeepWorking() throws Exception {
        String slugA = JsonPath.read(send(get("/api/v1/tenants/me"), ownerAToken, null, null)
                .andReturn().getResponse().getContentAsString(), "$.slug");
        String slugB = JsonPath.read(send(get("/api/v1/tenants/me"), ownerBToken, null, null)
                .andReturn().getResponse().getContentAsString(), "$.slug");
        String searchBefore = send(get("/api/v1/tenants"), null, null, null).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(true, ((List<?>) JsonPath.read(searchBefore, "$[*].slug")).containsAll(List.of(slugA, slugB)));
        assertEquals(false, searchBefore.contains("tenant_"), "search must not expose schema names");

        send(patch("/api/v1/admin/tenants/" + shopB + "/enabled"), ownerAToken, null, "{\"enabled\":false}")
                .andExpect(status().isForbidden());
        send(patch("/api/v1/admin/tenants/" + shopB + "/enabled"), adminToken, null, "{\"enabled\":false}")
                .andExpect(status().isOk());

        send(get("/api/v1/services"), null, shopB, null)
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.error").value("TENANT_DISABLED"));
        send(post("/api/v1/appointments"), null, shopB,
                "{\"serviceId\":" + serviceB + ",\"clientName\":\"Late\",\"clientPhone\":\"3331112222\",\"startTime\":\"" + TOMORROW + "T15:00:00\"}")
                .andExpect(status().isForbidden());
        send(get("/api/v1/appointments"), ownerBToken, shopB, null).andExpect(status().isForbidden());
        send(get("/api/v1/tenants/me"), ownerBToken, null, null).andExpect(status().isOk());
        send(get("/api/v1/services"), null, shopA, null).andExpect(status().isOk());

        String searchWhileDisabled = send(get("/api/v1/tenants"), null, null, null).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        List<?> slugsWhileDisabled = JsonPath.read(searchWhileDisabled, "$[*].slug");
        assertEquals(true, slugsWhileDisabled.contains(slugA));
        assertEquals(false, slugsWhileDisabled.contains(slugB), "a disabled shop must not appear in search");
        send(get("/api/v1/tenants/" + slugB), null, null, null).andExpect(status().isForbidden());
        send(get("/api/v1/tenants/" + slugA), null, null, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.schemaName").doesNotExist());
        String adminList = send(get("/api/v1/admin/tenants"), adminToken, null, null).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(true, ((List<?>) JsonPath.read(adminList, "$[*].slug")).contains(slugB),
                "the admin panel must still list disabled shops so they can be re-enabled");

        send(patch("/api/v1/admin/tenants/" + shopB + "/enabled"), adminToken, null, "{\"enabled\":true}")
                .andExpect(status().isOk());
        send(get("/api/v1/services"), null, shopB, null).andExpect(status().isOk());
        assertEquals(true, ((List<?>) JsonPath.read(send(get("/api/v1/tenants"), null, null, null)
                .andReturn().getResponse().getContentAsString(), "$[*].slug")).contains(slugB));
    }

    @Test
    @Order(12)
    void unknownShopsAndMissingHeadersAreRefused() throws Exception {
        send(get("/api/v1/services"), null, 999999L, null).andExpect(status().isBadRequest());
        send(get("/api/v1/services"), null, null, null).andExpect(status().isBadRequest());
        send(get("/api/v1/appointments"), null, shopA, null).andExpect(status().isUnauthorized());
    }

    @Test
    @Order(13)
    void alternatingBetweenShopsOnTheSameThreadNeverMixesData() throws Exception {
        for (int round = 0; round < 5; round++) {
            assertEquals(List.of("Alpha Haircut"), names("/api/v1/services", null, shopA, "$[*].name"));
            assertEquals(List.of("Beta Haircut", "Beta Color"), names("/api/v1/services", null, shopB, "$[*].name"));
        }
    }

    @Test
    @Order(14)
    void guestBookingsAreLinkedOnlyToTheAccountWhosePhoneAndNameBothMatch() throws Exception {
        long annInA = book(null, shopA, serviceA, "Anna Bianchi", "12:00:00");
        long annInB = book(null, shopB, serviceB, "Anna Bianchi", "12:00:00");
        long martaInA = book(null, shopA, serviceA, "Marta Rossi", "12:30:00");

        String run = suffix();
        String annToken = savePhone(signUpNamed("anna-" + run + "@torni.test", "consumer", "anna  BIANCHI"),
                "anna  BIANCHI", "+39 333 111 2222");

        // Nothing is linked until she looks, then exactly her two bookings (one per shop) are.
        List<Integer> inA = ids("/api/v1/appointments/me", annToken, shopA);
        List<Integer> inB = ids("/api/v1/appointments/me", annToken, shopB);
        assertEquals(true, inA.contains((int) annInA), "her guest booking in shop A should be linked");
        assertEquals(false, inA.contains((int) martaInA), "same phone but another name must not be linked");
        assertEquals(true, inB.contains((int) annInB), "her guest booking in shop B should be linked");

        // The first account to claim a booking keeps it: a second account with the same details gets nothing.
        String lateToken = savePhone(signUpNamed("late-" + run + "@torni.test", "consumer", "Anna Bianchi"),
                "Anna Bianchi", "3331112222");
        assertEquals(false, ids("/api/v1/appointments/me", lateToken, shopA).contains((int) annInA));
        assertEquals(false, ids("/api/v1/appointments/me", lateToken, shopB).contains((int) annInB));

        // Same phone, other name: only Marta's own booking, never Anna's.
        String martaToken = savePhone(signUpNamed("marta-" + run + "@torni.test", "consumer", "Marta Rossi"),
                "Marta Rossi", "3331112222");
        List<Integer> martaInAList = ids("/api/v1/appointments/me", martaToken, shopA);
        assertEquals(true, martaInAList.contains((int) martaInA));
        assertEquals(false, martaInAList.contains((int) annInA));

        // A linked booking behaves like any other of hers: she can cancel it, the late account cannot.
        send(patch("/api/v1/appointments/" + annInA + "/status"), lateToken, shopA, "{\"status\":\"CANCELLED\"}")
                .andExpect(status().isForbidden());
        send(patch("/api/v1/appointments/" + annInA + "/status"), annToken, shopA, "{\"status\":\"CANCELLED\"}")
                .andExpect(status().isOk());

        // Owners never claim: a business account with the same name and phone sees nothing of it.
        String ownerLookalike = savePhone(signUpNamed("lookalike-" + run + "@torni.test", "business", "Anna Bianchi"),
                "Anna Bianchi", "3331112222");
        long untouched = book(null, shopA, serviceA, "Anna Bianchi", "09:30:00");
        assertEquals(List.of(), ids("/api/v1/appointments/me", ownerLookalike, shopA));
        assertEquals(false, ids("/api/v1/appointments/me", annToken, shopB).contains((int) untouched));
    }
}
