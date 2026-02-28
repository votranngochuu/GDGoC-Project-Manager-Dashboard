package com.gdgoc.dashboard.controller;

import com.gdgoc.dashboard.dto.request.CreateTaskRequest;
import com.gdgoc.dashboard.dto.request.UpdateTaskRequest;
import com.gdgoc.dashboard.dto.response.TaskResponse;
import com.gdgoc.dashboard.entity.User;
import com.gdgoc.dashboard.enums.TaskStatus;
import com.gdgoc.dashboard.security.CurrentUser;
import com.gdgoc.dashboard.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TaskResponse>> getProjectTasks(@PathVariable UUID projectId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<TaskResponse> createTask(@PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request,
            @CurrentUser User currentUser) {
        TaskResponse task = taskService.createTask(projectId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(task);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable UUID id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable UUID id,
            @RequestBody UpdateTaskRequest request,
            @CurrentUser User currentUser) {
        return ResponseEntity.ok(taskService.updateTask(id, request, currentUser));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(@PathVariable UUID id,
            @RequestBody Map<String, String> body,
            @CurrentUser User currentUser) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            throw new IllegalArgumentException("Status is required");
        }
        // Normalize status string (remove spaces and uppercase)
        TaskStatus newStatus = TaskStatus.valueOf(statusStr.replace(" ", "_").toUpperCase());
        return ResponseEntity.ok(taskService.updateTaskStatus(id, newStatus, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id,
            @CurrentUser User currentUser) {
        taskService.deleteTask(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    public ResponseEntity<List<TaskResponse>> getMyTasks(@CurrentUser User currentUser) {
        return ResponseEntity.ok(taskService.getTasksByUser(currentUser.getId()));
    }
}
