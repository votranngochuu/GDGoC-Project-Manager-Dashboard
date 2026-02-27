# 🚀 Frontend Requirements & API Alignment (GDGoC Dashboard)

This document outlines the functional requirements documented for Backend (BE) alignment. It serves as a guide for what the Frontend (FE) expects from the APIs to fully support the current UI features.

## 1. Dashboard API Endpoints
The FE expect specialized data sets based on the User Role.

### [ADMIN] `/dashboard/admin`
- `totalProjects`: (Long) Total project count.
- `activeProjects`: (Long) Projects with status `ACTIVE`.
- `totalTasks`: (Long) Total task count.
- `overallCompletion`: (Double/Int) Average completion % of all projects.
- `topContributors`: (List<ContributorStats>) Top users by score.

### [LEADER] `/dashboard/leader/{projectId}`
- `totalTasks`: (Long) Project-specific task count.
- `completedTasks`: (Long) Tasks with status `DONE`.
- `inProgressTasks`: (Long) Tasks with status `IN_PROGRESS`.
- `todoTasks`: (Long) Tasks with status `TODO`.
- `memberPerformances`: (List<ContributorStats>) Dynamic performance of project members.

### [MEMBER] `/dashboard/member`
- `completedTasks`: (Long) Individual tasks done.
- `inProgressTasks`: (Long) Individual tasks current.
- `todoTasks`: (Long) Individual tasks pending.
- `overdueTasks`: (Long) Individual tasks past deadline.

## 2. Recent Items Widget (Optimization Needed)
**BE Improvement Request:** Include a `recentItems` list directly in the dashboard response DTOs to reduce API calls.
- **For Admin/Leader:** Last 3-5 created/updated Projects.
- **For Member:** Last 3-5 assigned/updated Tasks.

## 3. Time Tracker Module
**BE Requirement for Persistence:**
- **Endpoints:**
    - `POST /tasks/{id}/time/start`: Record start timestamp.
    - `POST /tasks/{id}/time/stop`: Calculate and save duration.
- **DTOs:** Add `totalTimeSpent` (seconds) to the `TaskResponse`.

## 4. Resource & Entity Mapping
- **Status Consistency:** Ensure `TaskStatus` and `ProjectStatus` enums in Java match the FE badge colors (e.g., `DONE` -> green, `ACTIVE` -> blue).
- **Profile Data:** The FE looks for `photoUrl` in user responses to render avatars.

---

> [!IMPORTANT]
> Reference these requirements when updating the `DashboardService` and DTOs in the `com.gdgoc.dashboard` package.
