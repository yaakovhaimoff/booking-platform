package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.entity.AccountEntity;
import com.ServiceBookingPlatform.exception.AccountException;
import com.ServiceBookingPlatform.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Password accounts for the local auth mode, and the one place that turns a token subject into our own account
 * id. When Auth0 takes over, the password parts and TokenService go away; the subject lookup stays.
 */
@Service
@RequiredArgsConstructor
public class AccountService {

    public static final String SUBJECT_PREFIX = "local|";
    private static final int MAX_PASSWORD_BYTES = 72;

    private final AccountRepository accountRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public static String subjectOf(AccountEntity account) {
        return SUBJECT_PREFIX + account.getId();
    }

    /** One lookup on accounts.auth_subject. Null when the subject belongs to no account. */
    public Long resolveAccountId(String subject) {
        if (subject == null || subject.isBlank()) {
            return null;
        }
        return accountRepository.findByAuthSubject(subject).map(AccountEntity::getId)
                .orElseGet(() -> healAuthSubject(subject));
    }

    // An account that has no auth_subject yet (made before the backfill ran) is found by the id inside its
    // "local|<id>" subject and fixed on the spot, so a missed row never locks its owner out.
    private Long healAuthSubject(String subject) {
        if (!subject.startsWith(SUBJECT_PREFIX)) {
            return null;
        }
        try {
            return accountRepository.findById(Long.parseLong(subject.substring(SUBJECT_PREFIX.length())))
                    .filter(account -> account.getAuthSubject() == null)
                    .map(account -> {
                        account.setAuthSubject(subject);
                        return accountRepository.save(account).getId();
                    }).orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @Transactional
    public AccountEntity signUp(String identity, String password, String name, String accountType) {
        String normalized = normalize(identity);
        if (normalized.isEmpty() || normalized.length() > 255 || !validPassword(password)) {
            throw new AccountException(HttpStatus.BAD_REQUEST, "INVALID");
        }
        if (accountRepository.findByIdentity(normalized).isPresent()) {
            throw new AccountException(HttpStatus.CONFLICT, "ACCOUNT_EXISTS");
        }
        String cleanName = name == null ? null : name.trim();
        if (cleanName != null && cleanName.length() > 100) {
            throw new AccountException(HttpStatus.BAD_REQUEST, "INVALID");
        }
        AccountEntity saved = accountRepository.save(AccountEntity.builder()
                .identity(normalized)
                .name(cleanName)
                .accountType(normalizeType(accountType))
                .passwordHash(encoder.encode(password))
                .createdAt(LocalDateTime.now())
                .build());
        saved.setAuthSubject(subjectOf(saved));
        return accountRepository.save(saved);
    }

    public AccountEntity logIn(String identity, String password, String accountTypeHint) {
        AccountEntity account = accountRepository.findByIdentity(normalize(identity))
                .orElseThrow(() -> new AccountException(HttpStatus.NOT_FOUND, "NO_ACCOUNT"));
        if (password == null || !encoder.matches(password, account.getPasswordHash())) {
            throw new AccountException(HttpStatus.UNAUTHORIZED, "WRONG_PASSWORD");
        }
        boolean changed = false;
        if (account.getAccountType() == null) {
            account.setAccountType(normalizeType(accountTypeHint));
            changed = true;
        }
        if (account.getAuthSubject() == null) {
            account.setAuthSubject(subjectOf(account));
            changed = true;
        }
        return changed ? accountRepository.save(account) : account;
    }

    public AccountEntity updateProfile(AuthenticatedUser user, String name, String phone) {
        AccountEntity account = findByAccountId(user.accountId() != null ? user.accountId() : resolveAccountId(user.subject()));
        String cleanName = name == null ? "" : name.trim();
        if (cleanName.isEmpty() || cleanName.length() > 100) {
            throw new AccountException(HttpStatus.BAD_REQUEST, "INVALID");
        }
        String digits = phone == null ? "" : phone.replaceAll("\\D", "");
        if (digits.length() > 30) {
            throw new AccountException(HttpStatus.BAD_REQUEST, "INVALID");
        }
        account.setName(cleanName);
        account.setPhone(digits.isEmpty() ? null : digits);
        return accountRepository.save(account);
    }

    private AccountEntity findByAccountId(Long accountId) {
        if (accountId == null) {
            throw new AccountException(HttpStatus.NOT_FOUND, "NO_ACCOUNT");
        }
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new AccountException(HttpStatus.NOT_FOUND, "NO_ACCOUNT"));
    }

    private static boolean validPassword(String password) {
        return password != null && password.length() >= 6
                && password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= MAX_PASSWORD_BYTES;
    }

    private static String normalize(String identity) {
        return identity == null ? "" : identity.trim().toLowerCase();
    }

    private static String normalizeType(String accountType) {
        return AuthenticatedUser.BUSINESS.equals(accountType) ? AuthenticatedUser.BUSINESS : AuthenticatedUser.CONSUMER;
    }
}
