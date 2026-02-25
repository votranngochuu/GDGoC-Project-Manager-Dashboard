package com.gdgoc.dashboard.service;

import com.gdgoc.dashboard.dto.response.UserResponse;
import com.gdgoc.dashboard.entity.User;
import com.gdgoc.dashboard.enums.Role;
import com.gdgoc.dashboard.exception.ResourceNotFoundException;
import com.gdgoc.dashboard.repository.UserRepository;
import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    /**
     * Verify a Firebase ID token and find-or-create the user in the database.
     * Returns a UserResponse with the user's info and role.
     */
    @Transactional
    public UserResponse loginWithFirebase(String idToken) {
        if (FirebaseApp.getApps().isEmpty()) {
            throw new IllegalStateException("Firebase is not configured. Please add firebase-service-account.json.");
        }

        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail();
            String name = decodedToken.getName();
            String picture = decodedToken.getPicture();

            User user = userRepository.findByFirebaseUid(uid)
                    .orElseGet(() -> {
                        User newUser = User.builder()
                                .firebaseUid(uid)
                                .email(email)
                                .displayName(name)
                                .photoUrl(picture)
                                .role(Role.MEMBER)
                                .build();
                        return userRepository.save(newUser);
                    });

            // Update profile info on every login (in case user changed their Google
            // profile)
            user.setDisplayName(name);
            user.setPhotoUrl(picture);
            userRepository.save(user);

            return toResponse(user);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid Firebase ID token: " + e.getMessage());
        }
    }

    public static UserResponse toResponse(User user) {
        if (user == null)
            return null;
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .photoUrl(user.getPhotoUrl())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
