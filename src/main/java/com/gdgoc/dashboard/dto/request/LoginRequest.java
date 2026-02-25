package com.gdgoc.dashboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Firebase ID token is required")
    private String idToken;
}
