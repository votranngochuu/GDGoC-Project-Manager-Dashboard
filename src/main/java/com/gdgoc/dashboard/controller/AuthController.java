package com.gdgoc.dashboard.controller;

import com.gdgoc.dashboard.dto.request.LoginRequest;
import com.gdgoc.dashboard.dto.response.UserResponse;
import com.gdgoc.dashboard.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/login
     * Body: { "idToken": "<firebase-id-token>" }
     * Returns: UserResponse with user info and role.
     */
    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request) {
        UserResponse user = authService.loginWithFirebase(request.getIdToken());
        return ResponseEntity.ok(user);
    }
}
