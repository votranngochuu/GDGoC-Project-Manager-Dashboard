package com.gdgoc.dashboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    private String name;

    private String description;

    private java.time.LocalDate startDate;

    private java.time.LocalDate endDate;
}
