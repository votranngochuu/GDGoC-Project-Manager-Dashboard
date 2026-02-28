package com.gdgoc.dashboard.dto.response;

import com.gdgoc.dashboard.enums.ProjectStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProjectResponse {
    private UUID id;
    private String name;
    private String description;
    private ProjectStatus status;
    private UserResponse leader;
    private long memberCount;
    private long taskCount;
    private java.time.LocalDate startDate;
    private java.time.LocalDate endDate;
    private LocalDateTime createdAt;
}
