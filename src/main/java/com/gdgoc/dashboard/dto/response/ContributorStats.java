package com.gdgoc.dashboard.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class ContributorStats {
    private UUID userId;
    private String displayName;
    private long completedTasks;
    private long overdueTasks;
    private double completionRate;
    private int contributionScore;
}
