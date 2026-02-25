📌 GDGoC Performance Dashboard

A centralized project-based learning & performance tracking system for GDGoC FPTU.

1️⃣ 📖 Project Overview
🎯 Problem Statement

Hiện tại các vấn đề trong CLB:

Không có hệ thống quản lý dự án tập trung

Khó theo dõi tiến độ dự án

Không minh bạch đóng góp thành viên

Khó phát hiện thành viên tiềm năng

Điều này làm giảm hiệu quả vận hành và khó đánh giá năng lực thực sự.

💡 Proposed Solution

Xây dựng GDGoC Performance Dashboard:

Quản lý project theo mô hình project-based learning

Theo dõi task & deadline

Tự động thống kê đóng góp

Dashboard phân tích hiệu suất thành viên

Tích hợp Google Firebase Authentication

2️⃣ 🏗 System Architecture
🧠 Overall Flow

Frontend (React)
↓
Firebase Authentication (Google Login)
↓
Spring Boot Backend (Verify ID Token)
↓
PostgreSQL Database

(Optional)
Backend → Gemini API → Generate Project Summary

3️⃣ 👤 User Roles
1. Admin

Tạo project

Gán leader

Xem toàn bộ thống kê

2. Project Leader

Tạo task

Assign member

Update trạng thái

Xem dashboard project

3. Member

Xem task được giao

Update trạng thái task

Xem contribution cá nhân

4️⃣ 📦 Core Features (MVP Scope)
🔐 1. Authentication (Google – Firebase)
Description:

Đăng nhập bằng Google Account

Backend verify Firebase ID Token

Lưu user vào database nếu chưa tồn tại

Phân role (Admin / Leader / Member)

📁 2. Project Management
Features:
2.1 Create Project

Fields:

Project Name

Description

Start Date

End Date

Leader

2.2 View Project List

Filter by status (Active / Completed)

Search by name

2.3 Project Detail Page

Project info

Member list

Task list

Progress bar (% completed)

🗂 3. Task Management
3.1 Create Task

Fields:

Title

Description

Assignee

Deadline

Priority (Low / Medium / High)

Status (To-do / In Progress / Done)

3.2 Update Task Status

Member update trạng thái

Auto record updated time

3.3 Delete / Edit Task
📊 4. Contribution Tracking
System automatically tracks:

Number of tasks completed

Completion rate

Overdue tasks

Active participation score

Contribution Formula (Simple Version)

Contribution Score =
(Completed Tasks × 2)
− (Overdue Tasks × 1)

📈 5. Performance Dashboard
Admin Dashboard:

Total Projects

Active Projects

Total Tasks

Top 5 Active Members

Project completion percentage

Leader Dashboard:

Project progress chart

Member contribution comparison

Member Dashboard:

Personal stats

Completion rate

Performance ranking in project

🤖 6. (Optional) Gemini AI Integration

Feature:

Generate Weekly Project Summary

Example:
Click button →
Gemini returns:

“This week, the team completed 5 tasks with 80% progress…”

Purpose:

Intelligent insight

Enhance demo impact

5️⃣ 🗄 Database Design (High Level)
Tables:
users

id

firebase_uid

name

email

role

projects

id

name

description

leader_id

start_date

end_date

status

project_members

id

project_id

user_id

tasks

id

project_id

title

description

assignee_id

deadline

priority

status

created_at

updated_at

6️⃣ 🧩 API Endpoints (MVP)
Auth

POST /auth/verify-token

Project

GET /projects

POST /projects

GET /projects/{id}

PUT /projects/{id}

DELETE /projects/{id}

Task

POST /tasks

PUT /tasks/{id}

DELETE /tasks/{id}

GET /projects/{id}/tasks

Dashboard

GET /dashboard/admin

GET /dashboard/leader/{projectId}

GET /dashboard/member/{userId}

7️⃣ 🖥 Frontend Pages

Login Page (Google)

Dashboard Page

Project List Page

Project Detail Page

Task Board View

Profile Page

8️⃣ 🔐 Security

Firebase ID token verification

Role-based access control

Backend validate all requests

9️⃣ 🚀 Deployment Plan

Frontend:

Firebase Hosting

Backend:

Render / Railway / GCP

Database:

Supabase / PostgreSQL

🔟 📅 Development Roadmap
Phase 1:

Database schema

Auth integration

Phase 2:

Project CRUD

Task CRUD

Phase 3:

Contribution logic

Dashboard statistics

Phase 4:

UI polish

Testing

Deploy

🎤 Demo Flow

Login with Google

Create project

Add members

Create tasks

Update tasks

Show dashboard analytics

(Optional) Generate AI summary

🏁 Definition of Done (MVP)

User login works

Project CRUD works

Task CRUD works

Contribution auto-calculated

Dashboard displays correct stats

Deployed & accessible online
