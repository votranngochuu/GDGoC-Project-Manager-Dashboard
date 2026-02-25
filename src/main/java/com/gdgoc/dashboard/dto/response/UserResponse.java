package com.gdgoc.dashboard.dto.response;

import com.gdgoc.dashboard.enums.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String email;
    private String displayName;
    private String photoUrl;
    private Role role;
    private LocalDateTime createdAt;
}
