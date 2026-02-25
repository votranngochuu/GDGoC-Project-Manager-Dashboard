package com.gdgoc.dashboard.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardMemberResponse {
    private long totalAssigned;
    private long completedTasks;
    private long overdueTasks;
    private long inProgressTasks;
    private long todoTasks;
    private double completionRate;
    private int contributionScore;
}
