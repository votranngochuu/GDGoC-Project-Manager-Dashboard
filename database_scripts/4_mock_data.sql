-- =============================================
-- DỮ LIỆU MẪU CHO GDGOC PERFORMANCE DASHBOARD
-- PostgreSQL (Supabase)
-- Thứ tự INSERT: users → projects → project_members → tasks
-- ID type: UUID (tự generate bởi gen_random_uuid())
-- Enum values: UPPERCASE (khớp Java Enum)
-- Sử dụng subquery thay vì hardcode ID để tránh lỗi FK
-- =============================================

-- =============================================
-- 1. Users (5 thành viên GDGoC FPTU)
-- Role: 1 ADMIN, 2 LEADER, 2 MEMBER
-- firebase_uid: giả lập ID từ Firebase Auth (Google Login)
-- display_name: tên hiển thị (thay vì 'name')
-- photo_url: ảnh đại diện (nullable)
-- =============================================
INSERT INTO users (firebase_uid, display_name, email, role) VALUES
('uid_admin_tuan',   'Trần Quốc Tuấn',    'tuan.admin@gmail.com',   'ADMIN'),
('uid_leader_mai',   'Lê Hoàng Mai',       'mai.leader@gmail.com',   'LEADER'),
('uid_leader_phong', 'Võ Thanh Phong',     'phong.leader@gmail.com', 'LEADER'),
('uid_member_nhi',   'Đặng Yến Nhi',       'nhi.member@gmail.com',   'MEMBER'),
('uid_member_bao',   'Huỳnh Gia Bảo',     'bao.member@gmail.com',   'MEMBER');

-- =============================================
-- 2. Projects (3 dự án: 2 ACTIVE, 1 COMPLETED)
-- leader_id: FK → users.id (dùng subquery theo firebase_uid)
-- Không còn start_date, end_date (backend không dùng)
-- =============================================
INSERT INTO projects (name, description, leader_id, status) VALUES
(
    'GDGoC Performance Dashboard',
    'Hệ thống quản lý dự án và theo dõi hiệu suất cho GDGoC FPTU',
    (SELECT id FROM users WHERE firebase_uid = 'uid_leader_mai'),
    'ACTIVE'
),
(
    'GDGoC Website Redesign',
    'Thiết kế lại website chính thức cho GDGoC FPTU Chapter',
    (SELECT id FROM users WHERE firebase_uid = 'uid_leader_phong'),
    'ACTIVE'
),
(
    'Workshop Management System',
    'Hệ thống đăng ký và quản lý các buổi workshop của CLB',
    (SELECT id FROM users WHERE firebase_uid = 'uid_leader_mai'),
    'COMPLETED'
);

-- =============================================
-- 3. Project_Members (phân bố members vào projects)
-- Mỗi project có leader + members
-- Dùng subquery để lấy đúng project_id và user_id
-- =============================================

-- Project 1: GDGoC Performance Dashboard (4 members)
INSERT INTO project_members (project_id, user_id) VALUES
((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'), (SELECT id FROM users WHERE firebase_uid = 'uid_leader_mai')),
((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'), (SELECT id FROM users WHERE firebase_uid = 'uid_member_nhi')),
((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'), (SELECT id FROM users WHERE firebase_uid = 'uid_member_bao')),
((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'), (SELECT id FROM users WHERE firebase_uid = 'uid_admin_tuan'));

-- Project 2: GDGoC Website Redesign (3 members)
INSERT INTO project_members (project_id, user_id) VALUES
((SELECT id FROM projects WHERE name = 'GDGoC Website Redesign'), (SELECT id FROM users WHERE firebase_uid = 'uid_leader_phong')),
((SELECT id FROM projects WHERE name = 'GDGoC Website Redesign'), (SELECT id FROM users WHERE firebase_uid = 'uid_member_nhi')),
((SELECT id FROM projects WHERE name = 'GDGoC Website Redesign'), (SELECT id FROM users WHERE firebase_uid = 'uid_member_bao'));

-- Project 3: Workshop Management System (3 members — đã COMPLETED)
INSERT INTO project_members (project_id, user_id) VALUES
((SELECT id FROM projects WHERE name = 'Workshop Management System'), (SELECT id FROM users WHERE firebase_uid = 'uid_leader_mai')),
((SELECT id FROM projects WHERE name = 'Workshop Management System'), (SELECT id FROM users WHERE firebase_uid = 'uid_leader_phong')),
((SELECT id FROM projects WHERE name = 'Workshop Management System'), (SELECT id FROM users WHERE firebase_uid = 'uid_admin_tuan'));

-- =============================================
-- 4. Tasks (18 tasks — đủ các status/priority để demo Dashboard)
-- Status flow: TODO → IN_PROGRESS → DONE
-- Priority: LOW / MEDIUM / HIGH
-- Contribution Score = (DONE × 2) − (Overdue × 1)
-- Không còn updated_at (backend không dùng)
-- Dùng subquery để lấy đúng project_id và assignee_id
-- =============================================

-- === Project 1: GDGoC Performance Dashboard ===

-- Tasks đã DONE (Sprint 1 hoàn thành)
INSERT INTO tasks (project_id, title, description, assignee_id, deadline, priority, status) VALUES
((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Thiết kế Database Schema',
    'Tạo schema PostgreSQL cho 4 bảng core: users, projects, project_members, tasks',
    (SELECT id FROM users WHERE firebase_uid = 'uid_leader_mai'),
    '2026-01-25', 'HIGH', 'DONE'),

((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Setup Firebase Authentication',
    'Cấu hình Google Sign-In + gửi ID Token cho backend verify',
    (SELECT id FROM users WHERE firebase_uid = 'uid_admin_tuan'),
    '2026-01-22', 'HIGH', 'DONE'),

((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Tạo UI Login Page',
    'Trang đăng nhập bằng Google với Firebase Auth',
    (SELECT id FROM users WHERE firebase_uid = 'uid_member_nhi'),
    '2026-01-28', 'MEDIUM', 'DONE'),

((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Dựng Layout chính (Sidebar + Header)',
    'Component layout chung cho toàn bộ app',
    (SELECT id FROM users WHERE firebase_uid = 'uid_member_nhi'),
    '2026-01-30', 'MEDIUM', 'DONE');

-- Tasks đang IN_PROGRESS
INSERT INTO tasks (project_id, title, description, assignee_id, deadline, priority, status) VALUES
((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Viết REST API cho Projects',
    'CRUD endpoints: GET/POST/PUT/DELETE /projects',
    (SELECT id FROM users WHERE firebase_uid = 'uid_leader_mai'),
    '2026-02-28', 'HIGH', 'IN_PROGRESS'),

((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Viết REST API cho Tasks',
    'CRUD endpoints: POST/PUT/DELETE /tasks, GET /projects/{id}/tasks',
    (SELECT id FROM users WHERE firebase_uid = 'uid_admin_tuan'),
    '2026-02-28', 'HIGH', 'IN_PROGRESS'),

((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Dựng Dashboard UI',
    'Component biểu đồ thống kê + bảng contribution',
    (SELECT id FROM users WHERE firebase_uid = 'uid_member_nhi'),
    '2026-03-05', 'HIGH', 'IN_PROGRESS');

-- Tasks còn TODO
INSERT INTO tasks (project_id, title, description, assignee_id, deadline, priority, status) VALUES
((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Viết API Dashboard Statistics',
    'Endpoints: GET /dashboard/admin, /dashboard/leader/{projectId}, /dashboard/member/{userId}',
    (SELECT id FROM users WHERE firebase_uid = 'uid_leader_mai'),
    '2026-03-05', 'HIGH', 'TODO'),

((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Tích hợp Contribution Tracking',
    'Tự động tính Contribution Score = (DONE × 2) − (Overdue × 1)',
    (SELECT id FROM users WHERE firebase_uid = 'uid_member_bao'),
    '2026-03-08', 'MEDIUM', 'TODO'),

((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Viết Unit Tests',
    'Test coverage >= 80% cho backend API',
    (SELECT id FROM users WHERE firebase_uid = 'uid_member_bao'),
    '2026-03-10', 'MEDIUM', 'TODO'),

((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Deploy lên Supabase + Firebase Hosting',
    'Deploy backend và frontend lên cloud',
    (SELECT id FROM users WHERE firebase_uid = 'uid_admin_tuan'),
    '2026-03-14', 'LOW', 'TODO');

-- Task quá hạn (overdue) — để test Dashboard hiển thị overdue
INSERT INTO tasks (project_id, title, description, assignee_id, deadline, priority, status) VALUES
((SELECT id FROM projects WHERE name = 'GDGoC Performance Dashboard'),
    'Viết tài liệu API Documentation',
    'Swagger/OpenAPI spec cho tất cả endpoints',
    (SELECT id FROM users WHERE firebase_uid = 'uid_member_bao'),
    '2026-02-15', 'LOW', 'IN_PROGRESS');

-- === Project 2: GDGoC Website Redesign ===
INSERT INTO tasks (project_id, title, description, assignee_id, deadline, priority, status) VALUES
((SELECT id FROM projects WHERE name = 'GDGoC Website Redesign'),
    'Thiết kế UI/UX Wireframe',
    'Wireframe cho trang chủ, about, events',
    (SELECT id FROM users WHERE firebase_uid = 'uid_member_nhi'),
    '2026-02-15', 'HIGH', 'DONE'),

((SELECT id FROM projects WHERE name = 'GDGoC Website Redesign'),
    'Dựng trang chủ mới',
    'Implement homepage theo design mới',
    (SELECT id FROM users WHERE firebase_uid = 'uid_leader_phong'),
    '2026-03-01', 'HIGH', 'IN_PROGRESS');

INSERT INTO tasks (project_id, title, description, assignee_id, deadline, priority, status) VALUES
((SELECT id FROM projects WHERE name = 'GDGoC Website Redesign'),
    'Trang Events & Registration',
    'Trang sự kiện + form đăng ký',
    (SELECT id FROM users WHERE firebase_uid = 'uid_member_bao'),
    '2026-03-10', 'MEDIUM', 'TODO');

-- === Project 3: Workshop Management (COMPLETED — tất cả DONE) ===
INSERT INTO tasks (project_id, title, description, assignee_id, deadline, priority, status) VALUES
((SELECT id FROM projects WHERE name = 'Workshop Management System'),
    'Thiết kế hệ thống đăng ký Workshop',
    'Schema DB + API cho đăng ký workshop',
    (SELECT id FROM users WHERE firebase_uid = 'uid_leader_mai'),
    '2025-10-01', 'HIGH', 'DONE'),

((SELECT id FROM projects WHERE name = 'Workshop Management System'),
    'Dựng giao diện quản lý Workshop',
    'Admin panel quản lý danh sách workshop',
    (SELECT id FROM users WHERE firebase_uid = 'uid_leader_phong'),
    '2025-11-01', 'HIGH', 'DONE'),

((SELECT id FROM projects WHERE name = 'Workshop Management System'),
    'Deploy và Testing',
    'Deploy lên production + integration testing',
    (SELECT id FROM users WHERE firebase_uid = 'uid_admin_tuan'),
    '2025-12-10', 'MEDIUM', 'DONE');
