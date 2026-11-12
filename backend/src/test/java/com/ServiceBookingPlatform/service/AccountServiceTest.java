package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.entity.AccountEntity;
import com.ServiceBookingPlatform.exception.AccountException;
import com.ServiceBookingPlatform.repository.AccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AccountServiceTest {

    private AccountRepository repository;
    private AccountService service;

    @BeforeEach
    void setUp() {
        repository = mock(AccountRepository.class);
        when(repository.save(any(AccountEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        service = new AccountService(repository);
    }

    private AccountEntity stored(String identity, String password, String type) {
        return AccountEntity.builder().id(3L).identity(identity).accountType(type)
                .passwordHash(new BCryptPasswordEncoder().encode(password)).createdAt(LocalDateTime.now()).build();
    }

    private static AccountException failure(Runnable action) {
        return assertThrows(AccountException.class, action::run);
    }

    @Test
    void signUpNormalizesTheIdentityHashesThePasswordAndKeepsTheType() {
        AccountEntity account = service.signUp("  Owner@Torni.TEST ", "secret1", "  Owner ", "business");

        assertEquals("owner@torni.test", account.getIdentity());
        assertEquals("Owner", account.getName());
        assertEquals("business", account.getAccountType());
        assertNotEquals("secret1", account.getPasswordHash());
        assertTrue(new BCryptPasswordEncoder().matches("secret1", account.getPasswordHash()));
    }

    @Test
    void anUnknownOrMissingAccountTypeBecomesConsumer() {
        assertEquals("consumer", service.signUp("a@torni.test", "secret1", null, "admin").getAccountType());
        assertEquals("consumer", service.signUp("b@torni.test", "secret1", null, null).getAccountType());
    }

    @Test
    void signUpRejectsBadInput() {
        assertEquals("INVALID", failure(() -> service.signUp("", "secret1", null, null)).getCode());
        assertEquals("INVALID", failure(() -> service.signUp("a@torni.test", "short", null, null)).getCode());
        assertEquals("INVALID", failure(() -> service.signUp("a@torni.test", null, null, null)).getCode());
        assertEquals("INVALID", failure(() -> service.signUp("a@torni.test", "x".repeat(73), null, null)).getCode());
        assertEquals("INVALID", failure(() -> service.signUp("a@torni.test", "secret1", "n".repeat(101), null)).getCode());
        verify(repository, never()).save(any());
    }

    @Test
    void signUpRejectsAnExistingIdentity() {
        when(repository.findByIdentity("a@torni.test")).thenReturn(Optional.of(stored("a@torni.test", "secret1", "consumer")));

        AccountException error = failure(() -> service.signUp("A@torni.test", "secret1", null, null));

        assertEquals(HttpStatus.CONFLICT, error.getStatus());
        assertEquals("ACCOUNT_EXISTS", error.getCode());
    }

    @Test
    void logInAcceptsTheRightPasswordAndRejectsTheWrongOne() {
        when(repository.findByIdentity("a@torni.test")).thenReturn(Optional.of(stored("a@torni.test", "secret1", "consumer")));

        assertEquals(3L, service.logIn("A@Torni.test", "secret1", null).getId());
        AccountException wrong = failure(() -> service.logIn("a@torni.test", "wrong-pass", null));
        assertEquals(HttpStatus.UNAUTHORIZED, wrong.getStatus());
        assertEquals("WRONG_PASSWORD", wrong.getCode());
        assertEquals("WRONG_PASSWORD", failure(() -> service.logIn("a@torni.test", null, null)).getCode());
    }

    @Test
    void logInReportsAnUnknownAccount() {
        AccountException error = failure(() -> service.logIn("nobody@torni.test", "secret1", null));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatus());
        assertEquals("NO_ACCOUNT", error.getCode());
    }

    @Test
    void logInGivesAnOldAccountItsTypeFromTheFirstLoginOnly() {
        AccountEntity legacy = stored("old@torni.test", "secret1", null);
        when(repository.findByIdentity("old@torni.test")).thenReturn(Optional.of(legacy));

        assertEquals("business", service.logIn("old@torni.test", "secret1", "business").getAccountType());
        assertEquals("business", service.logIn("old@torni.test", "secret1", "consumer").getAccountType(),
                "a typed account must not change type through a login hint");
    }

    @Test
    void updateProfileSavesTrimmedNameAndDigitsOnlyPhoneForTheTokenOwner() {
        AccountEntity account = stored("a@torni.test", "secret1", "consumer");
        when(repository.findById(3L)).thenReturn(Optional.of(account));
        AuthenticatedUser user = new AuthenticatedUser("local|3", null, null, "consumer");

        AccountEntity updated = service.updateProfile(user, "  Ann B ", "+39 333-111");

        assertEquals("Ann B", updated.getName());
        assertEquals("39333111", updated.getPhone());
    }

    @Test
    void updateProfileClearsAnEmptyPhone() {
        AccountEntity account = stored("a@torni.test", "secret1", "consumer");
        account.setPhone("123");
        when(repository.findById(3L)).thenReturn(Optional.of(account));

        assertNull(service.updateProfile(new AuthenticatedUser("local|3", null, null, null), "Ann", " ").getPhone());
    }

    @Test
    void updateProfileRejectsBadInputAndForeignSubjects() {
        AccountEntity account = stored("a@torni.test", "secret1", "consumer");
        account.setAuthSubject("local|3");
        when(repository.findByAuthSubject("local|3")).thenReturn(Optional.of(account));
        when(repository.findById(3L)).thenReturn(Optional.of(account));
        AuthenticatedUser user = new AuthenticatedUser("local|3", null, null, null);

        assertEquals("INVALID", failure(() -> service.updateProfile(user, " ", "1")).getCode());
        assertEquals("INVALID", failure(() -> service.updateProfile(user, "n".repeat(101), "1")).getCode());
        assertEquals("INVALID", failure(() -> service.updateProfile(user, "Ann", "1".repeat(31))).getCode());
        assertEquals("NO_ACCOUNT", failure(() -> service.updateProfile(
                new AuthenticatedUser("auth0|abc", null, null, null), "Ann", "1")).getCode());
        assertEquals("NO_ACCOUNT", failure(() -> service.updateProfile(
                new AuthenticatedUser("local|notanumber", null, null, null), "Ann", "1")).getCode());
        assertEquals("NO_ACCOUNT", failure(() -> service.updateProfile(
                new AuthenticatedUser(null, null, null, null), "Ann", "1")).getCode());
    }

    @Test
    void subjectsAreStableAndPrefixed() {
        assertEquals("local|3", AccountService.subjectOf(stored("a@torni.test", "secret1", null)));
    }

    @Test
    void signUpStoresTheProviderSubjectOnTheAccount() {
        when(repository.save(any(AccountEntity.class))).thenAnswer(invocation -> {
            AccountEntity account = invocation.getArgument(0);
            if (account.getId() == null) {
                account.setId(12L);
            }
            return account;
        });

        assertEquals("local|12", service.signUp("new@torni.test", "secret1", "New", "consumer").getAuthSubject());
    }

    @Test
    void logInFillsAMissingAuthSubject() {
        AccountEntity legacy = stored("old@torni.test", "secret1", "consumer");
        when(repository.findByIdentity("old@torni.test")).thenReturn(Optional.of(legacy));

        assertEquals("local|3", service.logIn("old@torni.test", "secret1", null).getAuthSubject());
    }

    @Test
    void resolveAccountIdIsOneLookupOnAuthSubject() {
        AccountEntity account = stored("a@torni.test", "secret1", "consumer");
        account.setAuthSubject("local|3");
        when(repository.findByAuthSubject("local|3")).thenReturn(Optional.of(account));

        assertEquals(3L, service.resolveAccountId("local|3"));
        verify(repository, never()).findById(any());
    }

    @Test
    void resolveAccountIdFixesAnAccountThatHasNoAuthSubjectYet() {
        AccountEntity account = stored("a@torni.test", "secret1", "consumer");
        when(repository.findByAuthSubject("local|3")).thenReturn(Optional.empty());
        when(repository.findById(3L)).thenReturn(Optional.of(account));

        assertEquals(3L, service.resolveAccountId("local|3"));
        assertEquals("local|3", account.getAuthSubject());
    }

    @Test
    void resolveAccountIdNeverReassignsAnAccountThatAlreadyHasAnotherSubject() {
        AccountEntity account = stored("a@torni.test", "secret1", "consumer");
        account.setAuthSubject("auth0|abc");
        when(repository.findByAuthSubject("local|3")).thenReturn(Optional.empty());
        when(repository.findById(3L)).thenReturn(Optional.of(account));

        assertNull(service.resolveAccountId("local|3"));
        assertEquals("auth0|abc", account.getAuthSubject());
    }

    @Test
    void resolveAccountIdIsNullForUnknownOrMalformedSubjects() {
        when(repository.findByAuthSubject(any())).thenReturn(Optional.empty());

        assertNull(service.resolveAccountId(null));
        assertNull(service.resolveAccountId(" "));
        assertNull(service.resolveAccountId("auth0|abc"));
        assertNull(service.resolveAccountId("local|notanumber"));
        assertNull(service.resolveAccountId("local|404"));
    }
}
