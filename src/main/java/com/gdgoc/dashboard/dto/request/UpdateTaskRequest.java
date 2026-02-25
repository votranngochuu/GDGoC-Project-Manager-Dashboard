package com.gdgoc.dashboard.dto.request;

import com.gdgoc.dashboard.enums.TaskPriority;
import com.gdgoc.dashboard.enums.TaskStatus;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class UpdateTaskRequest {

    private String title;

    private String description;

    private TaskStatus status;

    private TaskPriority priority;

    private LocalDate deadline;

    private UUID assigneeId;
}
