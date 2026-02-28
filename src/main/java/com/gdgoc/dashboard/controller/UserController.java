package com.gdgoc.dashboard.controller;

import com.gdgoc.dashboard.dto.response.UserResponse;
import com.gdgoc.dashboard.entity.User;
import com.gdgoc.dashboard.enums.Role;
import com.gdgoc.dashboard.security.CurrentUser;
import com.gdgoc.dashboard.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@CurrentUser User currentUser) {
        return ResponseEntity.ok(userService.getUserById(currentUser.getId()));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateRole(@PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @CurrentUser User currentUser) {
        Role newRole = Role.valueOf(body.get("role").toUpperCase());
        return ResponseEntity.ok(userService.updateUserRole(id, newRole, currentUser));
    }

    @PutMapping("/me/name")
    public ResponseEntity<UserResponse> updateProfile(
            @RequestBody com.gdgoc.dashboard.dto.request.UpdateProfileRequest request,
            @CurrentUser User currentUser) {
        return ResponseEntity.ok(userService.updateProfile(currentUser.getId(), request.getDisplayName()));
    }
}
