package com.gdgoc.dashboard.service;

import com.gdgoc.dashboard.dto.response.UserResponse;
import com.gdgoc.dashboard.entity.User;
import com.gdgoc.dashboard.enums.Role;
import com.gdgoc.dashboard.exception.ResourceNotFoundException;
import com.gdgoc.dashboard.exception.UnauthorizedException;
import com.gdgoc.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(AuthService::toResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return AuthService.toResponse(user);
    }

    @Transactional
    public UserResponse updateUserRole(UUID userId, Role newRole, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only admins can change user roles");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setRole(newRole);
        userRepository.save(user);

        return AuthService.toResponse(user);
    }
}
