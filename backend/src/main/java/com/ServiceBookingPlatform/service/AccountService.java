package com.ServiceBookingPlatform.service;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.entity.AccountEntity;
import com.ServiceBookingPlatform.exception.AccountException;
import com.ServiceBookingPlatform.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Password accounts for the local auth mode. When Auth0 takes over, this and TokenService go away and
 * the account name and phone move to a profile store keyed by the Auth0 subject.
 */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.auth.mode", havingValue = "local", matchIfMissing = true)
public class AccountService {

    public static final String SUBJECT_PREFIX = "local|";
    private static final int MAX_PASSWORD_BYTES = 72;

    private final AccountRepository accountRepository;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public static String subjectOf(AccountEntity account) {
        return SUBJECT_PREFIX + account.getId();
    }

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
        return accountRepository.save(AccountEntity.builder()
                .identity(normalized)
                .name(cleanName)
                .accountType(normalizeType(accountType))
                .passwordHash(encoder.encode(password))
                .createdAt(LocalDateTime.now())
                .build());
    }

    public AccountEntity logIn(String identity, String password, String accountTypeHint) {
        AccountEntity account = accountRepository.findByIdentity(normalize(identity))
                .orElseThrow(() -> new AccountException(HttpStatus.NOT_FOUND, "NO_ACCOUNT"));
        if (password == null || !encoder.matches(password, account.getPasswordHash())) {
            throw new AccountException(HttpStatus.UNAUTHORIZED, "WRONG_PASSWORD");
        }
        if (account.getAccountType() == null) {
            account.setAccountType(normalizeType(accountTypeHint));
            return accountRepository.save(account);
        }
        return account;
    }

    public AccountEntity updateProfile(AuthenticatedUser user, String name, String phone) {
        AccountEntity account = findBySubject(user.subject());
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

    private AccountEntity findBySubject(String subject) {
        if (subject == null || !subject.startsWith(SUBJECT_PREFIX)) {
            throw new AccountException(HttpStatus.NOT_FOUND, "NO_ACCOUNT");
        }
        try {
            return accountRepository.findById(Long.parseLong(subject.substring(SUBJECT_PREFIX.length())))
                    .orElseThrow(() -> new AccountException(HttpStatus.NOT_FOUND, "NO_ACCOUNT"));
        } catch (NumberFormatException e) {
            throw new AccountException(HttpStatus.NOT_FOUND, "NO_ACCOUNT");
        }
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
