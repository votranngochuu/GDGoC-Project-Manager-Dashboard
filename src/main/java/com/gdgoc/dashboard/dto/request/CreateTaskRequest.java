package com.gdgoc.dashboard.dto.request;

import com.gdgoc.dashboard.enums.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateTaskRequest {

    @NotBlank(message = "Task title is required")
    private String title;

    private String description;

    @NotNull(message = "Priority is required")
    private TaskPriority priority;

    private LocalDate deadline;

    private UUID assigneeId;
}
