package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.dto.AdminAccountResponse;
import com.ServiceBookingPlatform.dto.AdminClientResponse;
import com.ServiceBookingPlatform.dto.AdminSummaryResponse;
import com.ServiceBookingPlatform.dto.AdminTenantResponse;
import com.ServiceBookingPlatform.entity.AccountEntity;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.exception.AccountException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock TenantService tenantService;
    @Mock AccountService accountService;
    @Mock SchemaProvisioningService schemaProvisioningService;
    @Mock AdminAuditService adminAuditService;

    AdminService adminService;

    final AuthenticatedUser admin = new AuthenticatedUser("local|1", "boss@torni.test", "Boss", "business", null, 1L);

    @BeforeEach
    void setUp() {
        adminService = new AdminService(tenantService, accountService, schemaProvisioningService, adminAuditService);
    }

    private static TenantEntity shop(long id, String slug, Long ownerAccountId, boolean enabled) {
        return TenantEntity.builder().id(id).slug(slug).name("Shop " + id).schemaName("tenant_" + id)
                .ownerAuth0Id("local|" + ownerAccountId).ownerAccountId(ownerAccountId).enabled(enabled)
                .createdAt(LocalDateTime.now()).build();
    }

    private static AccountEntity account(long id, String identity, String type) {
        return AccountEntity.builder().id(id).identity(identity).accountType(type).authSubject("local|" + id)
                .passwordHash("secret-hash").createdAt(LocalDateTime.now()).build();
    }

    @Test
    void shopsListCarriesBookingCountLastActivityAndPublicVisibility() {
        LocalDateTime last = LocalDateTime.of(2026, 5, 1, 10, 0);
        when(tenantService.listAllTenants()).thenReturn(List.of(shop(1, "alpha", 2L, true), shop(2, "beta", 3L, false)));
        when(schemaProvisioningService.statisticsOf("tenant_1"))
                .thenReturn(new SchemaProvisioningService.ShopStatistics(4, 2, last));
        when(schemaProvisioningService.statisticsOf("tenant_2"))
                .thenReturn(new SchemaProvisioningService.ShopStatistics(0, 0, null));

        List<AdminTenantResponse> shops = adminService.listShops();

        assertEquals(4, shops.get(0).getBookingCount());
        assertEquals(last, shops.get(0).getLastActivity());
        assertTrue(shops.get(0).isVisibleToPublic());
        assertEquals(false, shops.get(1).isVisibleToPublic());
        assertNull(shops.get(1).getLastActivity());
    }

    @Test
    void accountsListShowsWhichShopEachOwnsAndNeverExposesThePasswordHash() {
        when(tenantService.listAllTenants()).thenReturn(List.of(shop(1, "alpha", 2L, true)));
        when(accountService.listAll()).thenReturn(List.of(
                account(2, "owner@torni.test", "business"), account(3, "client@torni.test", "consumer")));

        List<AdminAccountResponse> accounts = adminService.listAccounts();

        assertEquals("alpha", accounts.get(0).getOwnedShopSlug());
        assertNull(accounts.get(1).getOwnedShopId());
        assertTrue(!accounts.toString().contains("secret-hash"));
    }

    @Test
    void clientsListJoinsAccountEmailAndReviewCountsPerShop() {
        when(tenantService.listAllTenants()).thenReturn(List.of(shop(1, "alpha", 2L, true)));
        when(accountService.listAll()).thenReturn(List.of(account(3, "client@torni.test", "consumer")));
        LocalDateTime when = LocalDateTime.of(2026, 5, 1, 10, 0);
        when(schemaProvisioningService.clientsOf("tenant_1")).thenReturn(List.of(
                new SchemaProvisioningService.ClientRow(3L, "Dana", "3331112222", 2, when),
                new SchemaProvisioningService.ClientRow(null, "Guest", "3339998888", 1, when)));
        when(schemaProvisioningService.reviewCountsByAccount("tenant_1")).thenReturn(Map.of(3L, 1));

        List<AdminClientResponse> clients = adminService.listClients();

        assertEquals("client@torni.test", clients.get(0).getEmail());
        assertEquals(1, clients.get(0).getReviewCount());
        assertEquals("alpha", clients.get(0).getShopSlug());
        assertNull(clients.get(1).getEmail());
        assertEquals(0, clients.get(1).getReviewCount());
    }

    @Test
    void summaryTotalsShopsAccountsClientsAndBookings() {
        when(tenantService.listAllTenants()).thenReturn(List.of(shop(1, "alpha", 2L, true), shop(2, "beta", 3L, false)));
        when(schemaProvisioningService.statisticsOf(anyString()))
                .thenReturn(new SchemaProvisioningService.ShopStatistics(3, 1, null));
        when(schemaProvisioningService.clientsOf(anyString())).thenReturn(List.of(
                new SchemaProvisioningService.ClientRow(null, "A", "1", 3, LocalDateTime.now())));
        when(accountService.listAll()).thenReturn(List.of(account(2, "a@x", "business"), account(3, "b@x", "consumer"),
                account(4, "c@x", "consumer")));

        AdminSummaryResponse summary = adminService.summary();

        assertEquals(2, summary.getShops());
        assertEquals(1, summary.getVisibleShops());
        assertEquals(1, summary.getHiddenShops());
        assertEquals(3, summary.getAccounts());
        assertEquals(1, summary.getBusinessAccounts());
        assertEquals(2, summary.getConsumerAccounts());
        assertEquals(2, summary.getClients());
        assertEquals(6, summary.getBookings());
    }

    @Test
    void changingVisibilityIsLogged() {
        when(tenantService.setTenantEnabled(2L, false)).thenReturn(shop(2, "beta", 3L, false));

        adminService.setShopEnabled(admin, 2L, false);

        verify(adminAuditService).record(eq("boss@torni.test"), eq(AdminService.SHOP_VISIBILITY_CHANGED),
                eq("SHOP"), eq(2L), eq("beta"), contains("hidden"));
    }

    @Test
    void deletingAShopNeedsItsExactSlugAndTouchesNothingOtherwise() {
        when(tenantService.getTenantById(5L)).thenReturn(shop(5, "old-shop-abc123", 9L, true));

        AccountException wrong = assertThrows(AccountException.class, () -> adminService.deleteShop(admin, 5L, "old-shop"));
        assertThrows(AccountException.class, () -> adminService.deleteShop(admin, 5L, null));

        assertEquals("CONFIRMATION_MISMATCH", wrong.getCode());
        assertEquals(HttpStatus.BAD_REQUEST, wrong.getStatus());
        verify(tenantService, never()).deleteTenant(anyLong());
        verify(adminAuditService, never()).record(any(), any(), any(), any(), any(), any());
    }

    @Test
    void deletingAShopRemovesItAndLogsWhoWhatAndHowMuch() {
        when(tenantService.getTenantById(5L)).thenReturn(shop(5, "old-shop-abc123", 9L, true));
        when(schemaProvisioningService.statisticsOf("tenant_5"))
                .thenReturn(new SchemaProvisioningService.ShopStatistics(12, 3, null));
        when(tenantService.deleteTenant(5L)).thenReturn(4);

        adminService.deleteShop(admin, 5L, " old-shop-abc123 ");

        verify(tenantService).deleteTenant(5L);
        verify(adminAuditService).record(eq("boss@torni.test"), eq(AdminService.SHOP_DELETED), eq("SHOP"), eq(5L),
                eq("old-shop-abc123"), contains("12 booking(s), 3 review(s) and 4 photo(s)"));
    }

    @Test
    void anAccountIsDeletedOnlyWithItsExactIdentity() {
        when(accountService.getById(9L)).thenReturn(account(9, "old@torni.test", "consumer"));

        assertThrows(AccountException.class, () -> adminService.deleteAccount(admin, 9L, "someone@torni.test"));

        verify(accountService, never()).deleteAccount(anyLong());
        verify(tenantService, never()).unlinkAccountEverywhere(anyLong(), any());
    }

    @Test
    void theAdminCannotDeleteTheirOwnAccount() {
        when(accountService.getById(1L)).thenReturn(account(1, "boss@torni.test", "business"));

        AccountException refused = assertThrows(AccountException.class,
                () -> adminService.deleteAccount(admin, 1L, "boss@torni.test"));

        assertEquals("CANNOT_DELETE_OWN_ACCOUNT", refused.getCode());
        verify(accountService, never()).deleteAccount(anyLong());
    }

    @Test
    void anAccountThatOwnsAShopCannotBeDeletedUntilTheShopIsGone() {
        AccountEntity owner = account(9, "owner@torni.test", "business");
        when(accountService.getById(9L)).thenReturn(owner);
        when(tenantService.findShopOwnedBy(9L, "local|9")).thenReturn(Optional.of(shop(5, "alpha", 9L, true)));

        AccountException refused = assertThrows(AccountException.class,
                () -> adminService.deleteAccount(admin, 9L, "owner@torni.test"));

        assertEquals("ACCOUNT_OWNS_SHOP", refused.getCode());
        assertEquals(HttpStatus.CONFLICT, refused.getStatus());
        verify(accountService, never()).deleteAccount(anyLong());
    }

    @Test
    void deletingAnAccountDetachesItsBookingsFirstThenRemovesItAndLogsIt() {
        AccountEntity client = account(9, "old@torni.test", "consumer");
        when(accountService.getById(9L)).thenReturn(client);
        when(tenantService.findShopOwnedBy(9L, "local|9")).thenReturn(Optional.empty());
        when(tenantService.unlinkAccountEverywhere(9L, "local|9")).thenReturn(3);

        adminService.deleteAccount(admin, 9L, "old@torni.test");

        org.mockito.InOrder order = org.mockito.Mockito.inOrder(tenantService, accountService);
        order.verify(tenantService).unlinkAccountEverywhere(9L, "local|9");
        order.verify(accountService).deleteAccount(9L);
        verify(adminAuditService).record(eq("boss@torni.test"), eq(AdminService.ACCOUNT_DELETED), eq("ACCOUNT"),
                eq(9L), eq("old@torni.test"), contains("3 booking/review row(s)"));
    }
}
