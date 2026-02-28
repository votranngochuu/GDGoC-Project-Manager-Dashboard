# 📊 GDGoC Performance Dashboard

> Hệ thống quản lý dự án & theo dõi hiệu suất thành viên CLB GDGoC FPTU.

[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.java.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.3-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)

---

## 📖 Mục Lục

- [Tổng Quan](#-tổng-quan)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Tech Stack](#-tech-stack)
- [Tính Năng](#-tính-năng)
- [Vai Trò Người Dùng](#-vai-trò-người-dùng)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Cài Đặt & Chạy](#-cài-đặt--chạy)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Bảo Mật](#-bảo-mật)
- [Contributing](#-contributing)

---

## 🎯 Tổng Quan

### Vấn Đề

Các câu lạc bộ công nghệ thường gặp khó khăn trong việc:

- **Không có hệ thống quản lý dự án tập trung** — công việc phân tán trên nhiều nền tảng
- **Khó theo dõi tiến độ dự án** — leader không biết member đang làm gì
- **Thiếu minh bạch đóng góp** — không đo lường được ai đóng góp nhiều hay ít
- **Khó phát hiện thành viên tiềm năng** — không có dữ liệu để đánh giá

### Giải Pháp

**GDGoC Performance Dashboard** giải quyết tất cả bằng một nền tảng duy nhất:

| Tính năng | Mô tả |
|-----------|-------|
| 📁 **Project Management** | Tạo, quản lý dự án theo mô hình project-based learning |
| ✅ **Task Tracking** | Giao việc, theo dõi deadline, cập nhật trạng thái real-time |
| 📊 **Contribution Scoring** | Tự động tính điểm đóng góp dựa trên tasks hoàn thành |
| 📈 **Analytics Dashboard** | Charts trực quan cho Admin, Leader, và Member |
| 🔐 **Google Authentication** | Đăng nhập an toàn bằng tài khoản Google |

---

## 🏗 Kiến Trúc Hệ Thống

```
┌─────────────────────────┐
│   Frontend (Vanilla JS) │
│   HTML + CSS + Chart.js │
└──────────┬──────────────┘
           │ Firebase ID Token
           ▼
┌─────────────────────────┐
│  Spring Boot Backend    │
│  ┌───────────────────┐  │
│  │ FirebaseTokenFilter│  │  ← Verify JWT
│  ├───────────────────┤  │
│  │ REST Controllers   │  │  ← API Endpoints
│  ├───────────────────┤  │
│  │ Service Layer      │  │  ← Business Logic
│  ├───────────────────┤  │
│  │ JPA Repositories   │  │  ← Data Access
│  └───────────────────┘  │
└──────────┬──────────────┘
           │ JDBC
           ▼
┌─────────────────────────┐
│     PostgreSQL DB       │
│  users, projects, tasks │
│  project_members        │
└─────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Công nghệ | Phiên bản | Mục đích |
|-----------|-----------|----------|
| Java | 21 | Ngôn ngữ chính |
| Spring Boot | 3.4.3 | Framework backend |
| Spring Security | 6.x | Bảo mật & phân quyền |
| Spring Data JPA | 3.x | ORM & data access |
| PostgreSQL | 16+ | Cơ sở dữ liBệu |
| Firebase Admin SDK | 9.x | Xác thực Google token |
| Springdoc OpenAPI | 2.8.6 | Swagger API docs |
| Lombok | — | Giảm boilerplate code |

### Frontend
| Công nghệ | Mục đích |
|-----------|----------|
| HTML5 + CSS3 | Giao diện |
| Vanilla JavaScript | Logic frontend |
| Chart.js 4.4 | Biểu đồ analytics |
| Firebase Auth SDK | Đăng nhập Google |
| Font Awesome 6 | Icons |
| Google Fonts (Outfit) | Typography |

---

## ✨ Tính Năng

### 🔐 Authentication
- Đăng nhập **Google Sign-In** qua Firebase
- Backend verify Firebase ID Token cho mọi request
- Tự động tạo user trong DB khi đăng nhập lần đầu
- Phân quyền tự động: **Admin** / **Leader** / **Member**

### 📁 Project Management
- Tạo, sửa, xóa dự án
- **5 trạng thái vòng đời**: `PLANNING` → `ACTIVE` → `ON_HOLD` / `COMPLETED` / `CANCELLED`
- Gán Leader cho project, thêm/xóa thành viên
- Hiển thị theo danh mục: Active / Upcoming / Overdue / Completed
- Tìm kiếm & lọc project

### ✅ Task Management
- Tạo task với title, description, deadline, priority, assignees
- **3 trạng thái task**: `TODO` → `IN_PROGRESS` → `DONE`
- **3 mức ưu tiên**: `LOW` / `MEDIUM` / `HIGH`
- Gán nhiều người cho 1 task (many-to-many)
- Tự động ghi nhận `createdAt` và `updatedAt`

### 📊 Analytics Dashboard

#### Admin Dashboard
- Tổng số projects, tasks, members
- Phân bổ dự án: active / upcoming / overdue / completed
- **Top 10 Contributors** với contribution score
- Progress gauge tổng thể
- **Chart.js bar chart** — phân phối hệ thống
- **Chart.js doughnut chart** — tiến độ tổng

#### Leader Dashboard  
- Thống kê task trong project: total / completed / in-progress / overdue
- Performance rankings của members trong project
- Task flow visualization

#### Member Dashboard
- Tỷ lệ hoàn thành cá nhân
- Số task hoàn thành / đang làm / trễ hạn
- Contribution score cá nhân

### 🏆 Contribution Scoring
```
Contribution Score = (Completed Tasks × 2) − (Overdue Tasks × 1)
```
- Tự động tính toán, không cần thao tác thủ công
- Hiển thị ranking trên dashboard
- Completion rate = % task hoàn thành / tổng task

### ⏱ Time Tracker
- Bộ đếm thời gian tích hợp trên dashboard
- Start / Pause / Stop controls
- Hiển thị real-time trên giao diện

### 📖 API Documentation (Swagger)
- Tự động generate tại `/gdgoc_dashboard/swagger-ui.html`
- Interactive — test API trực tiếp trên trình duyệt
- Tích hợp Firebase JWT authentication scheme

---

## 👤 Vai Trò Người Dùng

```
┌──────────┐    ┌───────────────┐    ┌──────────┐
│  ADMIN   │    │ PROJECT LEADER│    │  MEMBER  │
├──────────┤    ├───────────────┤    ├──────────┤
│• Tạo     │    │• Tạo task     │    │• Xem task│
│  project │    │• Assign member│    │  được    │
│• Gán     │    │• Update status│    │  giao    │
│  leader  │    │• Xem dashboard│    │• Update  │
│• Quản lý │    │  project      │    │  trạng   │
│  users   │    │• Xem members  │    │  thái    │
│• Xem toàn│    │  performance  │    │• Xem     │
│  bộ stats│    │               │    │  score   │
│• Đổi role│    │               │    │  cá nhân │
└──────────┘    └───────────────┘    └──────────┘
```

---

## 🗄 Database Schema

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│    users    │       │   projects   │       │    tasks    │
├─────────────┤       ├──────────────┤       ├─────────────┤
│ id (UUID)   │◄──┐   │ id (UUID)    │◄──┐   │ id (UUID)   │
│ firebase_uid│   │   │ name         │   │   │ title       │
│ email       │   │   │ description  │   │   │ description │
│ display_name│   ├───│ leader_id    │   ├───│ project_id  │
│ photo_url   │   │   │ status       │   │   │ status      │
│ role        │   │   │ start_date   │   │   │ priority    │
│ created_at  │   │   │ end_date     │   │   │ deadline    │
└─────────────┘   │   │ created_at   │   │   │ created_at  │
                  │   └──────────────┘   │   │ updated_at  │
                  │                      │   └─────────────┘
                  │   ┌──────────────┐   │         │
                  │   │project_members│   │   ┌─────────────┐
                  │   ├──────────────┤   │   │task_assignees│
                  ├───│ user_id      │   │   ├─────────────┤
                  │   │ project_id   │───┘   │ task_id     │
                  │   │ role         │       │ user_id     │
                  │   └──────────────┘       └─────────────┘
                  │                                │
                  └────────────────────────────────┘
```

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | `ADMIN`, `LEADER`, `MEMBER` |
| `ProjectStatus` | `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED` |
| `TaskStatus` | `TODO`, `IN_PROGRESS`, `DONE` |
| `TaskPriority` | `LOW`, `MEDIUM`, `HIGH` |

---

## 🔌 API Endpoints

Base URL: `http://localhost:8080/gdgoc_dashboard`

> 💡 Xem đầy đủ tại **Swagger UI**: [`/gdgoc_dashboard/swagger-ui.html`](http://localhost:8080/gdgoc_dashboard/swagger-ui.html)

### Authentication
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| `POST` | `/api/auth/login` | Đăng nhập bằng Firebase ID Token |

### Projects
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/projects` | ✅ | Lấy danh sách projects của user |
| `GET` | `/api/projects/{id}` | ✅ | Chi tiết project |
| `POST` | `/api/projects` | ✅ Admin | Tạo project mới |
| `PUT` | `/api/projects/{id}` | ✅ Admin/Leader | Cập nhật project |
| `DELETE` | `/api/projects/{id}` | ✅ Admin/Leader | Xóa project |
| `POST` | `/api/projects/{id}/members` | ✅ Admin/Leader | Thêm member |
| `DELETE` | `/api/projects/{id}/members/{userId}` | ✅ Admin/Leader | Xóa member |

### Tasks
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/tasks/project/{projectId}` | ✅ | Tasks trong project |
| `GET` | `/api/tasks/{id}` | ✅ | Chi tiết task |
| `GET` | `/api/tasks/my` | ✅ | Tasks của user hiện tại |
| `POST` | `/api/tasks/project/{projectId}` | ✅ Leader/Admin | Tạo task |
| `PUT` | `/api/tasks/{id}` | ✅ Leader/Admin | Cập nhật task |
| `PUT` | `/api/tasks/{id}/status` | ✅ Assignee/Leader | Đổi trạng thái |
| `DELETE` | `/api/tasks/{id}` | ✅ Leader/Admin | Xóa task |

### Dashboard
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/dashboard/admin` | ✅ Admin | Admin analytics |
| `GET` | `/api/dashboard/leader/{projectId}` | ✅ Leader | Leader analytics |
| `GET` | `/api/dashboard/member` | ✅ Member | Personal stats |

### Users
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| `GET` | `/api/users` | ✅ Admin | Danh sách users |
| `PATCH` | `/api/users/{id}/role` | ✅ Admin | Đổi role user |

---

## 🚀 Cài Đặt & Chạy

### Yêu Cầu

- **Java 21** (JDK)
- **Maven 3.9+**
- **PostgreSQL 16+**
- **Firebase Project** (có Google Sign-In enabled)

### 1. Clone Repository

```bash
git clone https://github.com/votranngochuu/GDGoC-Project-Manager-Dashboard.git
cd GDGoC-Project-Manager-Dashboard
```

### 2. Cấu Hình Database

Tạo database PostgreSQL:

```sql
CREATE DATABASE gdgoc_dashboard;
```

Cập nhật `src/main/resources/application.yml` nếu cần:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/gdgoc_dashboard
    username: postgres
    password: postgres
```

### 3. Cấu Hình Firebase

1. Tạo project trên [Firebase Console](https://console.firebase.google.com/)
2. Bật **Authentication** → **Google Sign-In**
3. Tải **Service Account Key** (JSON) từ **Project Settings** → **Service accounts**
4. Đặt file tại: `src/main/resources/firebase-service-account.json`
5. Cập nhật `frontend/firebase-init.js` với Firebase config của bạn

### 4. Chạy Backend

```bash
mvn spring-boot:run
```

Backend sẽ chạy tại: `http://localhost:8080/gdgoc_dashboard`

### 5. Chạy Frontend

Mở `frontend/index.html` bằng trình duyệt hoặc sử dụng Live Server:

```bash
# Với VS Code Live Server hoặc bất kỳ static file server
npx serve frontend
```

### 6. Truy Cập

| URL | Mô tả |
|-----|-------|
| `http://localhost:8080/gdgoc_dashboard/swagger-ui.html` | Swagger API Docs |
| `http://localhost:3000` (hoặc Live Server port) | Frontend UI |

---

## 📂 Cấu Trúc Thư Mục

```
GDGoC-Project-Manager-Dashboard/
├── src/main/java/com/gdgoc/dashboard/
│   ├── config/              # SecurityConfig, OpenApiConfig
│   ├── controller/          # REST API Controllers
│   │   ├── AuthController.java
│   │   ├── ProjectController.java
│   │   ├── TaskController.java
│   │   └── DashboardController.java
│   ├── dto/
│   │   ├── request/         # CreateProjectRequest, CreateTaskRequest...
│   │   └── response/        # ProjectResponse, TaskResponse, Dashboard DTOs
│   ├── entity/              # JPA Entities (User, Project, Task, ProjectMember)
│   ├── enums/               # ProjectStatus, TaskStatus, TaskPriority, UserRole
│   ├── exception/           # GlobalExceptionHandler, custom exceptions
│   ├── repository/          # Spring Data JPA Repositories
│   ├── security/            # FirebaseTokenFilter, CurrentUser annotation
│   └── service/             # Business logic (ProjectService, TaskService...)
│
├── src/main/resources/
│   ├── application.yml      # Cấu hình Spring Boot
│   └── firebase-service-account.json  # Firebase credentials (⚠️ không commit)
│
├── frontend/
│   ├── index.html           # Trang đăng nhập
│   ├── dashboard.html       # Trang dashboard chính
│   ├── app.js               # Logic frontend chính
│   ├── api.js               # API request helper
│   ├── auth.js              # Firebase auth handler
│   ├── firebase-init.js     # Firebase initialization
│   └── css/
│       ├── variables.css    # Design tokens (colors, spacing, shadows)
│       ├── base.css         # Reset & global styles
│       ├── auth.css         # Login page styles
│       ├── dashboard.css    # Dashboard layout
│       └── components.css   # Reusable components (cards, badges, modals...)
│
├── pom.xml                  # Maven dependencies
└── README.md
```

---

## 🔐 Bảo Mật

| Layer | Cơ chế |
|-------|--------|
| **Authentication** | Firebase ID Token verification (JWT) |
| **Authorization** | Spring Security + `@PreAuthorize` role-based |
| **Session** | Stateless (không lưu session trên server) |
| **Request Validation** | `@Valid` + Jakarta Bean Validation |
| **Error Handling** | `GlobalExceptionHandler` — format lỗi thống nhất |
| **CORS** | Configured trong SecurityConfig |

### Security Flow

```
Client → Bearer Token (Header) → FirebaseTokenFilter → Verify → Set Authentication
                                                          ↓
                                                    403 Forbidden
```

---

## 🤝 Contributing

1. **Fork** repository
2. Tạo feature branch: `git checkout -b feature/ten-tinh-nang`
3. Commit changes: `git commit -m "feat: mô tả"`
4. Push: `git push origin feature/ten-tinh-nang`
5. Tạo **Pull Request**

### Commit Convention

```
feat:     Tính năng mới
fix:      Sửa lỗi
refactor: Refactor code
docs:     Cập nhật tài liệu
style:    Format code, CSS
test:     Thêm test
```

---

## 📜 License

Dự án này được phát triển cho **CLB GDGoC — FPT University**.

---

<p align="center">
  <b>Built with ❤️ by GDGoC FPTU Team</b>
</p>
