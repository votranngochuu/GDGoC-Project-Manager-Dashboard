package com.gdgoc.dashboard.repository;

import com.gdgoc.dashboard.entity.Task;
import com.gdgoc.dashboard.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByProjectId(UUID projectId);

    List<Task> findByAssigneesId(UUID assigneeId);

    long countByAssigneesIdAndStatus(UUID assigneeId, TaskStatus status);

    long countByAssigneesIdAndDeadlineBeforeAndStatusNot(UUID assigneeId, LocalDate date, TaskStatus status);

    long countByProjectId(UUID projectId);

    long countByProjectIdAndStatus(UUID projectId, TaskStatus status);

    List<Task> findByProjectIdAndAssigneesId(UUID projectId, UUID assigneeId);

    // Admin dashboard: count tasks by status (avoids N+1 findAll)
    long countByStatus(TaskStatus status);

    // Admin dashboard: count overdue tasks (avoids N+1 findAll)
    long countByDeadlineBeforeAndStatusNot(LocalDate date, TaskStatus status);
}
