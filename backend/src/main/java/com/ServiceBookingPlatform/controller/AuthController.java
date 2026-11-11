package com.ServiceBookingPlatform.controller;

import com.ServiceBookingPlatform.config.AuthenticatedUser;
import com.ServiceBookingPlatform.dto.AuthResponse;
import com.ServiceBookingPlatform.dto.CredentialsRequest;
import com.ServiceBookingPlatform.dto.ProfileUpdateRequest;
import com.ServiceBookingPlatform.entity.AccountEntity;
import com.ServiceBookingPlatform.service.AccountService;
import com.ServiceBookingPlatform.service.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Sign-up, login and profile for the local auth mode. Login returns the bearer token every other route expects. */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.auth.mode", havingValue = "local", matchIfMissing = true)
public class AuthController {

    private final AccountService accountService;
    private final TokenService tokenService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signUp(@RequestBody CredentialsRequest request) {
        AccountEntity account = accountService.signUp(
                request.identity(), request.password(), request.name(), request.accountType());
        return ResponseEntity.ok(AuthResponse.of(tokenService.issue(account), account));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> logIn(@RequestBody CredentialsRequest request) {
        AccountEntity account = accountService.logIn(request.identity(), request.password(), request.accountType());
        return ResponseEntity.ok(AuthResponse.of(tokenService.issue(account), account));
    }

    @PutMapping("/profile")
    public ResponseEntity<AuthResponse> updateProfile(AuthenticatedUser user, @RequestBody ProfileUpdateRequest request) {
        AccountEntity account = accountService.updateProfile(user, request.name(), request.phone());
        return ResponseEntity.ok(AuthResponse.of(tokenService.issue(account), account));
    }
}
