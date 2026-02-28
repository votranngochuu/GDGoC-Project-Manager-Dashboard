package com.gdgoc.dashboard.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DashboardAdminResponse {
    private long totalProjects;
    private long activeProjects;
    private long completedProjects;
    private long overdueProjects;
    private long upcomingProjects;
    private long totalMembers;
    private long totalTasks;
    private long completedTasks;
    private long overdueTasks;
    private List<ContributorStats> topContributors;
}
