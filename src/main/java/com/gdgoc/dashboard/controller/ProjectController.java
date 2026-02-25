package com.gdgoc.dashboard.controller;

import com.gdgoc.dashboard.dto.request.CreateProjectRequest;
import com.gdgoc.dashboard.dto.request.UpdateProjectRequest;
import com.gdgoc.dashboard.dto.response.ProjectResponse;
import com.gdgoc.dashboard.entity.User;
import com.gdgoc.dashboard.security.CurrentUser;
import com.gdgoc.dashboard.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjects(@CurrentUser User currentUser) {
        return ResponseEntity.ok(projectService.getProjectsByUser(currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable UUID id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request,
            @CurrentUser User currentUser) {
        ProjectResponse project = projectService.createProject(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(project);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable UUID id,
            @RequestBody UpdateProjectRequest request,
            @CurrentUser User currentUser) {
        return ResponseEntity.ok(projectService.updateProject(id, request, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id,
            @CurrentUser User currentUser) {
        projectService.deleteProject(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ProjectResponse> addMember(@PathVariable UUID id,
            @RequestBody Map<String, UUID> body,
            @CurrentUser User currentUser) {
        return ResponseEntity.ok(projectService.addMember(id, body.get("userId"), currentUser));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable UUID id,
            @PathVariable UUID userId,
            @CurrentUser User currentUser) {
        projectService.removeMember(id, userId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
