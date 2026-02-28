package com.gdgoc.dashboard.service;

import com.gdgoc.dashboard.dto.request.CreateTaskRequest;
import com.gdgoc.dashboard.dto.request.UpdateTaskRequest;
import com.gdgoc.dashboard.dto.response.TaskResponse;
import com.gdgoc.dashboard.entity.Project;
import com.gdgoc.dashboard.entity.Task;
import com.gdgoc.dashboard.entity.User;
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
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public List<TaskResponse> getTasksByProject(UUID projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getTasksByUser(UUID userId) {
        return taskRepository.findByAssigneesId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TaskResponse getTaskById(UUID id) {
        Task task = findTaskOrThrow(id);
        return toResponse(task);
    }

    @Transactional
    public TaskResponse createTask(UUID projectId, CreateTaskRequest request, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        validateTaskManageAccess(project, currentUser);

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .deadline(request.getDeadline())
                .status(TaskStatus.TODO)
                .project(project)
                .build();

        if (request.getAssigneeIds() != null && !request.getAssigneeIds().isEmpty()) {
            List<User> assignees = userRepository.findAllById(request.getAssigneeIds());
            if (assignees.size() != request.getAssigneeIds().size()) {
                throw new ResourceNotFoundException("One or more assignees not found");
            }

            for (User assignee : assignees) {
                if (!projectMemberRepository.existsByProjectIdAndUserId(project.getId(), assignee.getId())
                        && (project.getLeader() == null || !project.getLeader().getId().equals(assignee.getId()))) {
                    throw new IllegalArgumentException("Assignee must be a member or leader of the project");
                }
            }
            task.setAssignees(assignees);
        }

        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTask(UUID id, UpdateTaskRequest request, User currentUser) {
        Task task = findTaskOrThrow(id);
        validateTaskManageAccess(task.getProject(), currentUser);

        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        if (request.getDeadline() != null) {
            task.setDeadline(request.getDeadline());
        }
        if (request.getAssigneeIds() != null) {
            List<User> assignees = userRepository.findAllById(request.getAssigneeIds());
            if (assignees.size() != request.getAssigneeIds().size()) {
                throw new ResourceNotFoundException("One or more assignees not found");
            }

            for (User assignee : assignees) {
                if (!projectMemberRepository.existsByProjectIdAndUserId(task.getProject().getId(), assignee.getId())
                        && (task.getProject().getLeader() == null
                                || !task.getProject().getLeader().getId().equals(assignee.getId()))) {
                    throw new IllegalArgumentException("Assignee must be a member or leader of the project");
                }
            }
            task.setAssignees(assignees);
        }

        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse updateTaskStatus(UUID id, TaskStatus newStatus, User currentUser) {
        Task task = findTaskOrThrow(id);

        // Allow assignees to update their own task status, plus leaders and admins
        boolean isAssignee = task.getAssignees() != null
                && task.getAssignees().stream().anyMatch(u -> u.getId().equals(currentUser.getId()));
        boolean isLeaderOrAdmin = currentUser.getRole() == Role.ADMIN
                || (task.getProject().getLeader() != null
                        && task.getProject().getLeader().getId().equals(currentUser.getId()));

        if (!isAssignee && !isLeaderOrAdmin) {
            throw new UnauthorizedException("You can only update your own task status");
        }

        task.setStatus(newStatus);
        return toResponse(taskRepository.save(task));
    }

    @Transactional
    public void deleteTask(UUID id, User currentUser) {
        Task task = findTaskOrThrow(id);
        validateTaskManageAccess(task.getProject(), currentUser);
        taskRepository.delete(task);
    }

    // --- Helpers ---

    private Task findTaskOrThrow(UUID id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }

    private void validateTaskManageAccess(Project project, User user) {
        if (user.getRole() == Role.ADMIN)
            return;
        if (project.getLeader() != null && project.getLeader().getId().equals(user.getId()))
            return;
        throw new UnauthorizedException("Only project leaders and admins can manage tasks");
    }

    private TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .deadline(task.getDeadline())
                .projectId(task.getProject().getId())
                .assignees(task.getAssignees() == null ? null
                        : task.getAssignees().stream()
                                .map(AuthService::toResponse)
                                .collect(Collectors.toList()))
                .createdAt(task.getCreatedAt())
                .build();
    }
}
