package com.gdgoc.dashboard.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class DashboardLeaderResponse {
    private UUID projectId;
    private String projectName;
    private long memberCount;
    private long totalTasks;
    private long todoTasks;
    private long inProgressTasks;
    private long completedTasks;
    private long overdueTasks;
    private List<ContributorStats> memberPerformances;
}
