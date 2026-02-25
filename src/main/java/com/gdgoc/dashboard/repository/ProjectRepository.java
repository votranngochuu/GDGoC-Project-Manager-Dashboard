package com.gdgoc.dashboard.repository;

import com.gdgoc.dashboard.entity.Project;
import com.gdgoc.dashboard.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findByStatus(ProjectStatus status);

    List<Project> findByLeaderId(UUID leaderId);

    long countByStatus(ProjectStatus status);
}
