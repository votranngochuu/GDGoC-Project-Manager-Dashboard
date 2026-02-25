package com.gdgoc.dashboard.dto.request;

import com.gdgoc.dashboard.enums.ProjectStatus;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateProjectRequest {

    private String name;

    private String description;

    private ProjectStatus status;

    private UUID leaderId;
}
