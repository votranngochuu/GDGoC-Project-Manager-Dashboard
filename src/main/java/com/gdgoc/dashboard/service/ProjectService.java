package com.gdgoc.dashboard.service;

import com.gdgoc.dashboard.dto.request.CreateProjectRequest;
import com.gdgoc.dashboard.dto.request.UpdateProjectRequest;
import com.gdgoc.dashboard.dto.response.ProjectResponse;
import com.gdgoc.dashboard.dto.response.UserResponse;
import com.gdgoc.dashboard.entity.Project;
import com.gdgoc.dashboard.entity.ProjectMember;
import com.gdgoc.dashboard.entity.User;
import com.gdgoc.dashboard.enums.ProjectStatus;
import com.gdgoc.dashboard.enums.Role;
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
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(UUID id) {
        Project project = findProjectOrThrow(id);
        return toResponse(project);
    }

    public List<ProjectResponse> getProjectsByUser(User user) {
        if (user.getRole() == Role.ADMIN) {
            return getAllProjects();
        }

        // Get projects where user is leader
        List<Project> leaderProjects = projectRepository.findByLeaderId(user.getId());

        // Get projects where user is a member
        List<UUID> memberProjectIds = projectMemberRepository.findByUserId(user.getId())
                .stream()
                .map(pm -> pm.getProject().getId())
                .toList();

        List<Project> memberProjects = memberProjectIds.stream()
                .map(this::findProjectOrThrow)
                .toList();

        // Combine and deduplicate
        return java.util.stream.Stream.concat(leaderProjects.stream(), memberProjects.stream())
                .distinct()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only admins can create projects");
        }

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .status(ProjectStatus.ACTIVE)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        if (request.getLeaderId() != null) {
            User leader = userRepository.findById(request.getLeaderId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("User not found with id: " + request.getLeaderId()));
            project.setLeader(leader);
        }

        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse updateProject(UUID id, UpdateProjectRequest request, User currentUser) {
        Project project = findProjectOrThrow(id);
        validateProjectAccess(project, currentUser);

        if (request.getName() != null) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            project.setEndDate(request.getEndDate());
        }
        if (request.getLeaderId() != null) {
            User leader = userRepository.findById(request.getLeaderId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("User not found with id: " + request.getLeaderId()));
            project.setLeader(leader);
        }

        return toResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(UUID id, User currentUser) {
        Project project = findProjectOrThrow(id);
        if (currentUser.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("Only admins can delete projects");
        }
        projectRepository.delete(project);
    }

    @Transactional
    public ProjectResponse addMember(UUID projectId, UUID userId, User currentUser) {
        Project project = findProjectOrThrow(projectId);
        validateProjectAccess(project, currentUser);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new IllegalArgumentException("User is already a member of this project");
        }

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(user)
                .build();
        projectMemberRepository.save(member);

        return toResponse(projectRepository.findById(projectId).orElseThrow());
    }

    @Transactional
    public void removeMember(UUID projectId, UUID userId, User currentUser) {
        Project project = findProjectOrThrow(projectId);
        validateProjectAccess(project, currentUser);

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in project"));

        projectMemberRepository.delete(member);
    }

    // --- Helpers ---

    private Project findProjectOrThrow(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private void validateProjectAccess(Project project, User user) {
        if (user.getRole() == Role.ADMIN)
            return;
        if (project.getLeader() != null && project.getLeader().getId().equals(user.getId()))
            return;
        throw new UnauthorizedException("You don't have access to manage this project");
    }

    private ProjectResponse toResponse(Project project) {
        long memberCount = projectMemberRepository.countByProjectId(project.getId());
        long taskCount = taskRepository.countByProjectId(project.getId());

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .leader(AuthService.toResponse(project.getLeader()))
                .memberCount(memberCount)
                .taskCount(taskCount)
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .createdAt(project.getCreatedAt())
                .build();
    }
}
