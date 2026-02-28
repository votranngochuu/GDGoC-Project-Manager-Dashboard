-- =============================================
-- GDGOC PERFORMANCE DASHBOARD — DATABASE SCHEMA
-- PostgreSQL (Supabase)
-- 4 bảng: users, projects, project_members, tasks
-- Matching Spring Boot Backend (JPA + PostgreSQL)
-- ID type: UUID (gen_random_uuid)
-- Enum values: UPPERCASE (khớp Java Enum)
-- =============================================

-- =============================================
-- Bảng 1: users
-- Lưu thông tin user từ Firebase Authentication
-- firebase_uid: ID từ Google Login (Firebase Auth)
-- role: phân quyền hệ thống (ADMIN / LEADER / MEMBER)
-- display_name: tên hiển thị của user
-- photo_url: URL ảnh đại diện từ Google Account
-- =============================================
CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid    VARCHAR(128)    NOT NULL UNIQUE,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    display_name    VARCHAR(255),
    photo_url       TEXT,
    role            VARCHAR(20)     NOT NULL DEFAULT 'MEMBER',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'LEADER', 'MEMBER'))
);

-- =============================================
-- Bảng 2: projects
-- Quản lý dự án theo mô hình project-based learning
-- leader_id: FK → users.id (người quản lý project)
-- status: ACTIVE (đang làm) / COMPLETED (hoàn thành)
-- =============================================
CREATE TABLE projects (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)    NOT NULL,
    description     TEXT,
    leader_id       UUID,
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_projects_leader
        FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_projects_status
        CHECK (status IN ('ACTIVE', 'COMPLETED'))
);

-- =============================================
-- Bảng 3: project_members
-- Quan hệ N:N giữa projects và users
-- Mỗi user chỉ join 1 lần per project (composite unique)
-- Xóa project → xóa luôn members (CASCADE)
-- =============================================
CREATE TABLE project_members (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID            NOT NULL,
    user_id         UUID            NOT NULL,
    joined_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pm_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_pm_project_user
        UNIQUE (project_id, user_id)
);

-- =============================================
-- Bảng 4: tasks
-- Task thuộc project, giao cho member
-- priority: LOW / MEDIUM / HIGH
-- status: TODO → IN_PROGRESS → DONE
-- Contribution Score = (DONE × 2) − (Overdue × 1)
-- =============================================
CREATE TABLE tasks (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID            NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    description     TEXT,
    assignee_id     UUID,
    deadline        DATE,
    priority        VARCHAR(20)     NOT NULL DEFAULT 'MEDIUM',
    status          VARCHAR(20)     NOT NULL DEFAULT 'TODO',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tasks_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_assignee
        FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_tasks_priority
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT chk_tasks_status
        CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE'))
);

-- =============================================
-- INDEXES: Tăng tốc các query Dashboard thường dùng
-- =============================================

-- Tasks: query theo project + status (project detail page)
CREATE INDEX ix_tasks_project_status ON tasks(project_id, status);

-- Tasks: query theo người được giao (member dashboard)
CREATE INDEX ix_tasks_assignee ON tasks(assignee_id);

-- Tasks: query theo deadline (upcoming deadlines)
CREATE INDEX ix_tasks_deadline ON tasks(deadline);

-- Project_Members: query projects của 1 user
CREATE INDEX ix_pm_user ON project_members(user_id);

-- Projects: filter theo status
CREATE INDEX ix_projects_status ON projects(status);

-- Users: lookup theo firebase_uid (auth verify)
-- (đã có UNIQUE constraint → tự tạo index)
