package com.gdgoc.dashboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @NotBlank(message = "Display name is required")
    private String displayName;
}
