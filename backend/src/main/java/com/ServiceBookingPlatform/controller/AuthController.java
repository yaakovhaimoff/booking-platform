package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.entity.AccountEntity;
import com.ServiceBookingPlatform.repository.AccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Password accounts shared across devices. Demo-grade: no session token is issued
 * (the app still identifies the user with the X-Dev-User-* headers), this only verifies credentials.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AccountRepository accounts;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthController(AccountRepository accounts) {
        this.accounts = accounts;
    }

    public record Credentials(String identity, String password, String name) {}

    public record ProfileUpdate(String identity, String name, String phone) {}

    private static Map<String, Object> body(AccountEntity a) {
        return Map.of("identity", a.getIdentity(),
                "name", a.getName() == null ? "" : a.getName(),
                "phone", a.getPhone() == null ? "" : a.getPhone());
    }

    private static String norm(String identity) {
        return identity == null ? "" : identity.trim().toLowerCase();
    }

    private static ResponseEntity<Map<String, Object>> err(HttpStatus s, String code) {
        return ResponseEntity.status(s).body(Map.of("error", code));
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Credentials c) {
        String id = norm(c.identity());
        if (id.isEmpty() || c.password() == null || c.password().length() < 6) {
            return err(HttpStatus.BAD_REQUEST, "INVALID");
        }
        if (accounts.findByIdentity(id).isPresent()) return err(HttpStatus.CONFLICT, "ACCOUNT_EXISTS");
        String name = c.name() == null ? null : c.name().trim();
        accounts.save(AccountEntity.builder()
                .identity(id).name(name)
                .passwordHash(encoder.encode(c.password()))
                .createdAt(LocalDateTime.now()).build());
        return ResponseEntity.ok(Map.of("identity", id, "name", name == null ? "" : name, "phone", ""));
    }

    // Demo-grade like the rest of auth: identifies the account by identity, no session yet.
    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody ProfileUpdate p) {
        var found = accounts.findByIdentity(norm(p.identity()));
        if (found.isEmpty()) return err(HttpStatus.NOT_FOUND, "NO_ACCOUNT");
        String name = p.name() == null ? "" : p.name().trim();
        if (name.isEmpty() || name.length() > 100) return err(HttpStatus.BAD_REQUEST, "INVALID");
        String phone = p.phone() == null ? "" : p.phone().replaceAll("\\D", "");
        if (phone.length() > 30) return err(HttpStatus.BAD_REQUEST, "INVALID");
        AccountEntity a = found.get();
        a.setName(name);
        a.setPhone(phone.isEmpty() ? null : phone);
        return ResponseEntity.ok(body(accounts.save(a)));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Credentials c) {
        var found = accounts.findByIdentity(norm(c.identity()));
        if (found.isEmpty()) return err(HttpStatus.NOT_FOUND, "NO_ACCOUNT");
        AccountEntity a = found.get();
        if (c.password() == null || !encoder.matches(c.password(), a.getPasswordHash())) {
            return err(HttpStatus.UNAUTHORIZED, "WRONG_PASSWORD");
        }
        return ResponseEntity.ok(body(a));
    }
}
