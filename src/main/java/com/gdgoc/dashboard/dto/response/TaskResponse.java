package com.gdgoc.dashboard.dto.response;

import com.gdgoc.dashboard.enums.TaskPriority;
import com.gdgoc.dashboard.enums.TaskStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class TaskResponse {
    private UUID id;
    private String title;
    private String description;
    private TaskStatus status;
    private TaskPriority priority;
    private LocalDate deadline;
    private UUID projectId;
    private List<UserResponse> assignees;
    private LocalDateTime createdAt;
}
