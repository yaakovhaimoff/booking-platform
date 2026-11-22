package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.dto.AdminAccountResponse;
import com.ServiceBookingPlatform.dto.AdminAuditResponse;
import com.ServiceBookingPlatform.dto.AdminClientResponse;
import com.ServiceBookingPlatform.dto.AdminSummaryResponse;
import com.ServiceBookingPlatform.dto.AdminTenantResponse;
import com.ServiceBookingPlatform.entity.AccountEntity;
import com.ServiceBookingPlatform.entity.TenantEntity;
import com.ServiceBookingPlatform.exception.AccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Everything the platform owner can see and do: usage lists, the visibility switch and permanent deletes.
 * The caller must already have passed the admin check; this class decides what a delete removes and keeps.
 *
 * Deleting a shop removes its photos, schema, bookings, reviews and tenant record, and keeps its owner's account.
 * Deleting an account is refused while it still owns a shop (delete the shop first) and always for the admin's
 * own account. A deleted account's bookings and reviews stay in the shops they belong to, detached from it.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    public static final String SHOP_DELETED = "SHOP_DELETED";
    public static final String ACCOUNT_DELETED = "ACCOUNT_DELETED";
    public static final String SHOP_VISIBILITY_CHANGED = "SHOP_VISIBILITY_CHANGED";

    private final TenantService tenantService;
    private final AccountService accountService;
    private final SchemaProvisioningService schemaProvisioningService;
    private final AdminAuditService adminAuditService;

    public List<AdminTenantResponse> listShops() {
        List<AdminTenantResponse> shops = new ArrayList<>();
        for (TenantEntity tenant : tenantService.listAllTenants()) {
            SchemaProvisioningService.ShopStatistics statistics = schemaProvisioningService.statisticsOf(tenant.getSchemaName());
            shops.add(AdminTenantResponse.from(tenant, statistics.bookings(), statistics.reviews(), statistics.lastActivity()));
        }
        return shops;
    }

    public List<AdminAccountResponse> listAccounts() {
        Map<Long, TenantEntity> shopByOwnerAccount = new HashMap<>();
        Map<String, TenantEntity> legacyShopBySubject = new HashMap<>();
        for (TenantEntity tenant : tenantService.listAllTenants()) {
            if (tenant.getOwnerAccountId() != null) {
                shopByOwnerAccount.put(tenant.getOwnerAccountId(), tenant);
            } else {
                legacyShopBySubject.put(tenant.getOwnerAuth0Id(), tenant);
            }
        }
        return accountService.listAll().stream()
                .map(account -> AdminAccountResponse.from(account,
                        shopByOwnerAccount.getOrDefault(account.getId(), legacyShopBySubject.get(account.getAuthSubject()))))
                .toList();
    }

    public List<AdminClientResponse> listClients() {
        Map<Long, AccountEntity> accountById = new HashMap<>();
        accountService.listAll().forEach(account -> accountById.put(account.getId(), account));
        List<AdminClientResponse> clients = new ArrayList<>();
        for (TenantEntity tenant : tenantService.listAllTenants()) {
            Map<Long, Integer> reviewsByAccount = schemaProvisioningService.reviewCountsByAccount(tenant.getSchemaName());
            for (SchemaProvisioningService.ClientRow row : schemaProvisioningService.clientsOf(tenant.getSchemaName())) {
                AccountEntity account = row.accountId() == null ? null : accountById.get(row.accountId());
                String identity = account == null ? null : account.getIdentity();
                clients.add(AdminClientResponse.builder()
                        .shopId(tenant.getId()).shopName(tenant.getName()).shopSlug(tenant.getSlug())
                        .accountId(row.accountId())
                        .name(row.name()).phone(row.phone())
                        .email(identity != null && identity.contains("@") ? identity : null)
                        .bookingCount(row.bookings())
                        .reviewCount(row.accountId() == null ? 0 : reviewsByAccount.getOrDefault(row.accountId(), 0))
                        .lastBooking(row.lastBooking())
                        .build());
            }
        }
        return clients;
    }

    public AdminSummaryResponse summary() {
        List<TenantEntity> tenants = tenantService.listAllTenants();
        int visible = (int) tenants.stream().filter(TenantEntity::isEnabled).count();
        int bookings = 0;
        int reviews = 0;
        int clients = 0;
        for (TenantEntity tenant : tenants) {
            SchemaProvisioningService.ShopStatistics statistics = schemaProvisioningService.statisticsOf(tenant.getSchemaName());
            bookings += statistics.bookings();
            reviews += statistics.reviews();
            clients += schemaProvisioningService.clientsOf(tenant.getSchemaName()).size();
        }
        List<AccountEntity> accounts = accountService.listAll();
        int business = (int) accounts.stream().filter(a -> AuthenticatedUser.BUSINESS.equals(a.getAccountType())).count();
        int consumer = (int) accounts.stream().filter(a -> AuthenticatedUser.CONSUMER.equals(a.getAccountType())).count();
        return AdminSummaryResponse.builder()
                .shops(tenants.size()).visibleShops(visible).hiddenShops(tenants.size() - visible)
                .accounts(accounts.size()).businessAccounts(business).consumerAccounts(consumer)
                .clients(clients).bookings(bookings).reviews(reviews)
                .build();
    }

    public List<AdminAuditResponse> auditLog() {
        return adminAuditService.latest().stream().map(AdminAuditResponse::from).toList();
    }

    public TenantEntity setShopEnabled(AuthenticatedUser admin, Long shopId, boolean enabled) {
        TenantEntity updated = tenantService.setTenantEnabled(shopId, enabled);
        adminAuditService.record(adminName(admin), SHOP_VISIBILITY_CHANGED, "SHOP", updated.getId(), updated.getSlug(),
                enabled ? "Shop is now visible to the public" : "Shop is now hidden from the public");
        return updated;
    }

    /** Deletes the shop only when the confirmation is exactly its slug. */
    public void deleteShop(AuthenticatedUser admin, Long shopId, String confirmation) {
        TenantEntity shop = tenantService.getTenantById(shopId);
        requireConfirmation(confirmation, shop.getSlug());
        SchemaProvisioningService.ShopStatistics statistics = schemaProvisioningService.statisticsOf(shop.getSchemaName());
        int photos = tenantService.deleteTenant(shopId);
        adminAuditService.record(adminName(admin), SHOP_DELETED, "SHOP", shop.getId(), shop.getSlug(),
                "Shop \"" + shop.getName() + "\" with " + statistics.bookings() + " booking(s), "
                        + statistics.reviews() + " review(s) and " + photos + " photo(s)");
    }

    /** Deletes the account only when the confirmation is exactly its identity, it is not the admin's own, and it owns no shop. */
    public void deleteAccount(AuthenticatedUser admin, Long accountId, String confirmation) {
        AccountEntity account = accountService.getById(accountId);
        requireConfirmation(confirmation, account.getIdentity());
        boolean isAdminsOwn = Objects.equals(admin.accountId(), account.getId())
                || (admin.subject() != null && admin.subject().equals(account.getAuthSubject()));
        if (isAdminsOwn) {
            throw new AccountException(HttpStatus.CONFLICT, "CANNOT_DELETE_OWN_ACCOUNT");
        }
        Optional<TenantEntity> ownedShop = tenantService.findShopOwnedBy(account.getId(), account.getAuthSubject());
        if (ownedShop.isPresent()) {
            throw new AccountException(HttpStatus.CONFLICT, "ACCOUNT_OWNS_SHOP");
        }
        int detached = tenantService.unlinkAccountEverywhere(account.getId(), account.getAuthSubject());
        accountService.deleteAccount(account.getId());
        adminAuditService.record(adminName(admin), ACCOUNT_DELETED, "ACCOUNT", account.getId(), account.getIdentity(),
                "Account (" + account.getAccountType() + "); " + detached + " booking/review row(s) kept but detached");
    }

    private static void requireConfirmation(String confirmation, String expected) {
        if (confirmation == null || !confirmation.trim().equals(expected)) {
            throw new AccountException(HttpStatus.BAD_REQUEST, "CONFIRMATION_MISMATCH");
        }
    }

    private static String adminName(AuthenticatedUser admin) {
        return admin.email() != null ? admin.email() : admin.subject();
    }
}
