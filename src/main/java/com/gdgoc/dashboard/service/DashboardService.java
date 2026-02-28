package com.gdgoc.dashboard.service;

import com.gdgoc.dashboard.dto.response.*;
import com.gdgoc.dashboard.entity.Project;
import com.gdgoc.dashboard.entity.ProjectMember;
import com.gdgoc.dashboard.entity.User;
import com.gdgoc.dashboard.enums.ProjectStatus;
import com.gdgoc.dashboard.enums.Role;
import com.gdgoc.dashboard.enums.TaskStatus;
import com.gdgoc.dashboard.exception.ResourceNotFoundException;
import com.gdgoc.dashboard.exception.UnauthorizedException;
import com.gdgoc.dashboard.repository.ProjectMemberRepository;
import com.gdgoc.dashboard.repository.ProjectRepository;
import com.gdgoc.dashboard.repository.TaskRepository;
import com.gdgoc.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

        private final ProjectRepository projectRepository;
        private final ProjectMemberRepository projectMemberRepository;
        private final TaskRepository taskRepository;
        private final UserRepository userRepository;

        /**
         * Admin dashboard: overall system statistics.
         */
        public DashboardAdminResponse getAdminDashboard() {
                LocalDate today = LocalDate.now();
                List<Project> allProjects = projectRepository.findAll();

                long totalProjects = allProjects.size();
                long completedProjects = allProjects.stream()
                                .filter(p -> p.getStatus() == ProjectStatus.COMPLETED)
                                .count();

                List<Project> nonCompleted = allProjects.stream()
                                .filter(p -> p.getStatus() != ProjectStatus.COMPLETED)
                                .collect(Collectors.toList());

                // Projects that have started and not yet reached deadline (or have no deadline)
                List<Project> activeProjectsList = nonCompleted.stream()
                                .filter(p -> p.getStartDate() != null && !p.getStartDate().isAfter(today)
                                                && (p.getEndDate() == null || !p.getEndDate().isBefore(today)))
                                .collect(Collectors.toList());
                long activeProjects = activeProjectsList.size();

                // Projects where end date has passed
                long overdueProjects = nonCompleted.stream()
                                .filter(p -> p.getEndDate() != null && p.getEndDate().isBefore(today))
                                .count();

                // Projects that haven't started yet (future start date)
                long upcomingProjects = nonCompleted.stream()
                                .filter(p -> p.getStartDate() != null && p.getStartDate().isAfter(today))
                                .count();

                // Set of active project IDs for task filtering
                Set<UUID> activeProjectIds = activeProjectsList.stream()
                                .map(Project::getId)
                                .collect(Collectors.toSet());

                long totalMembers = userRepository.count();
                long totalTasks = taskRepository.count();
                long completedTasks = taskRepository.countByStatus(TaskStatus.DONE);
                // Overdue tasks ONLY in active projects — use repository query
                long overdueTasks = activeProjectIds.isEmpty() ? 0
                                : taskRepository.findAll().stream()
                                                .filter(t -> t.getProject() != null
                                                                && activeProjectIds.contains(t.getProject().getId()))
                                                .filter(t -> t.getDeadline() != null
                                                                && t.getDeadline().isBefore(today)
                                                                && t.getStatus() != TaskStatus.DONE)
                                                .count();

                // Top contributors (top 10 by contribution score)
                List<ContributorStats> topContributors = userRepository.findAll().stream()
                                .map(this::calculateContributorStats)
                                .sorted(Comparator.comparingInt(ContributorStats::getContributionScore).reversed())
                                .limit(10)
                                .collect(Collectors.toList());

                return DashboardAdminResponse.builder()
                                .totalProjects(totalProjects)
                                .activeProjects(activeProjects)
                                .completedProjects(completedProjects)
                                .overdueProjects(overdueProjects)
                                .upcomingProjects(upcomingProjects)
                                .totalMembers(totalMembers)
                                .totalTasks(totalTasks)
                                .completedTasks(completedTasks)
                                .overdueTasks(overdueTasks)
                                .topContributors(topContributors)
                                .build();
        }

        /**
         * Leader dashboard: project-level statistics.
         */
        public DashboardLeaderResponse getLeaderDashboard(UUID projectId, User currentUser) {
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Project not found with id: " + projectId));

                // Validate access: must be leader of this project or admin
                boolean isLeader = project.getLeader() != null
                                && project.getLeader().getId().equals(currentUser.getId());
                if (currentUser.getRole() != Role.ADMIN && !isLeader) {
                        throw new UnauthorizedException("You are not the leader of this project");
                }

                long memberCount = projectMemberRepository.countByProjectId(projectId);
                long totalTasks = taskRepository.countByProjectId(projectId);
                long todoTasks = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.TODO);
                long inProgressTasks = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.IN_PROGRESS);
                long completedTasks = taskRepository.countByProjectIdAndStatus(projectId, TaskStatus.DONE);
                long overdueTasks = taskRepository.findByProjectId(projectId).stream()
                                .filter(t -> t.getDeadline() != null
                                                && t.getDeadline().isBefore(LocalDate.now())
                                                && t.getStatus() != TaskStatus.DONE)
                                .count();

                // Member performances in this project
                List<ContributorStats> memberPerformances = projectMemberRepository.findByProjectId(projectId)
                                .stream()
                                .map(pm -> calculateContributorStatsForProject(pm.getUser(), projectId))
                                .sorted(Comparator.comparingInt(ContributorStats::getContributionScore).reversed())
                                .collect(Collectors.toList());

                return DashboardLeaderResponse.builder()
                                .projectId(projectId)
                                .projectName(project.getName())
                                .memberCount(memberCount)
                                .totalTasks(totalTasks)
                                .todoTasks(todoTasks)
                                .inProgressTasks(inProgressTasks)
                                .completedTasks(completedTasks)
                                .overdueTasks(overdueTasks)
                                .memberPerformances(memberPerformances)
                                .build();
        }

        /**
         * Member dashboard: personal performance stats.
         */
        public DashboardMemberResponse getMemberDashboard(User currentUser) {
                UUID userId = currentUser.getId();

                long totalAssigned = taskRepository.findByAssigneesId(userId).size();
                long completedTasks = taskRepository.countByAssigneesIdAndStatus(userId, TaskStatus.DONE);
                long inProgressTasks = taskRepository.countByAssigneesIdAndStatus(userId, TaskStatus.IN_PROGRESS);
                long todoTasks = taskRepository.countByAssigneesIdAndStatus(userId, TaskStatus.TODO);
                long overdueTasks = taskRepository.countByAssigneesIdAndDeadlineBeforeAndStatusNot(
                                userId, LocalDate.now(), TaskStatus.DONE);

                double completionRate = totalAssigned > 0
                                ? (double) completedTasks / totalAssigned * 100
                                : 0;

                int contributionScore = calculateScore(completedTasks, overdueTasks);

                return DashboardMemberResponse.builder()
                                .totalAssigned(totalAssigned)
                                .completedTasks(completedTasks)
                                .inProgressTasks(inProgressTasks)
                                .todoTasks(todoTasks)
                                .overdueTasks(overdueTasks)
                                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                                .contributionScore(contributionScore)
                                .build();
        }

        // --- Contribution Score Logic ---

        /**
         * Contribution score formula:
         * score = (completedTasks × 10) − (overdueTasks × 5)
         *
         * Computed on-the-fly for freshness. Minimum score is 0.
         */
        private int calculateScore(long completedTasks, long overdueTasks) {
                int score = (int) (completedTasks * 10 - overdueTasks * 5);
                return Math.max(score, 0);
        }

        private ContributorStats calculateContributorStats(User user) {
                UUID userId = user.getId();
                long completed = taskRepository.countByAssigneesIdAndStatus(userId, TaskStatus.DONE);
                long overdue = taskRepository.countByAssigneesIdAndDeadlineBeforeAndStatusNot(
                                userId, LocalDate.now(), TaskStatus.DONE);
                long total = taskRepository.findByAssigneesId(userId).size();
                double completionRate = total > 0 ? (double) completed / total * 100 : 0;

                return ContributorStats.builder()
                                .userId(userId)
                                .displayName(user.getDisplayName())
                                .completedTasks(completed)
                                .overdueTasks(overdue)
                                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                                .contributionScore(calculateScore(completed, overdue))
                                .build();
        }

        private ContributorStats calculateContributorStatsForProject(User user, UUID projectId) {
                var tasks = taskRepository.findByProjectIdAndAssigneesId(projectId, user.getId());
                long completed = tasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count();
                long overdue = tasks.stream()
                                .filter(t -> t.getDeadline() != null
                                                && t.getDeadline().isBefore(LocalDate.now())
                                                && t.getStatus() != TaskStatus.DONE)
                                .count();
                long total = tasks.size();
                double completionRate = total > 0 ? (double) completed / total * 100 : 0;

                return ContributorStats.builder()
                                .userId(user.getId())
                                .displayName(user.getDisplayName())
                                .completedTasks(completed)
                                .overdueTasks(overdue)
                                .completionRate(Math.round(completionRate * 100.0) / 100.0)
                                .contributionScore(calculateScore(completed, overdue))
                                .build();
        }
}
