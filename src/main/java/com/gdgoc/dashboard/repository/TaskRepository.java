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

    List<Task> findByAssigneeId(UUID assigneeId);

    long countByAssigneeIdAndStatus(UUID assigneeId, TaskStatus status);

    long countByAssigneeIdAndDeadlineBeforeAndStatusNot(UUID assigneeId, LocalDate date, TaskStatus status);

    long countByProjectId(UUID projectId);

    long countByProjectIdAndStatus(UUID projectId, TaskStatus status);

    List<Task> findByProjectIdAndAssigneeId(UUID projectId, UUID assigneeId);
}
