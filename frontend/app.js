import { apiRequest } from './api.js';
import { logout } from './auth.js';

// Timer State
let timerInterval = null;
let timerSeconds = 0;
let isTimerRunning = false;

function formatTime(totalSeconds) {
     const h = Math.floor(totalSeconds / 3600);
     const m = Math.floor((totalSeconds % 3600) / 60);
     const s = totalSeconds % 60;
     return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

// utility
function requireAuth() {
     const token = localStorage.getItem('accessToken');
     if (!token) {
          window.location.href = 'index.html';
          throw new Error('Not authenticated');
     }
}

function hideAdmin() {
     const role = localStorage.getItem('role');
     if (role !== 'ADMIN') {
          document
               .querySelectorAll('.admin-only')
               .forEach((el) => (el.style.display = 'none'));
     }
}

// simple client-side navigation
function loadDashboard() {
     requireAuth();
     const role = localStorage.getItem('role');
     hideAdmin();
     const content = document.getElementById('content');
     content.innerHTML = `<div class="spinner"></div> Loading dashboard...`;
     let endpoint;
     if (role === 'ADMIN') endpoint = '/dashboard/admin';
     else if (role === 'LEADER')
          endpoint = '/dashboard/leader/' + localStorage.getItem('projectId');
     else endpoint = '/dashboard/member';

     apiRequest(endpoint)
          .then((data) => {
               renderDashboard(role, data || {});
          })
          .catch((err) => {
               content.innerHTML = `<p>Error: ${err.message}</p>`;
          });
}

function renderDashboard(role, data) {
     const content = document.getElementById('content');

     // Update Header User Info
     const nameEl = document.getElementById('user-display-name');
     const emailEl = document.getElementById('user-display-email');
     if (nameEl) nameEl.textContent = localStorage.getItem('displayName') || 'User';
     if (emailEl) emailEl.textContent = localStorage.getItem('userEmail') || '';

     let html = `
        <div class="dashboard-grid fade-in">
            <!-- ROW 1: STATS -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px;">
                <div class="card card-stat accent-blue">
                    <h4>Total Projects</h4>
                    <h2>${data.totalProjects || 0}</h2>
                </div>
                <div class="card card-stat accent-green">
                    <h4>Ended Projects</h4>
                    <h2>${data.activeProjects || 0}</h2>
                </div>
                <div class="card card-stat accent-red">
                    <h4>Running Projects</h4>
                    <h2>${data.totalTasks || 0}</h2>
                </div>
                <div class="card card-stat accent-yellow">
                    <h4>Overall Completion</h4>
                    <h2>${data.overallCompletion || 0}%</h2>
                </div>
            </div>

            <!-- ROW 2: ANALYTICS & PROJECT -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div class="card">
                    <h3 style="margin:0">Project Analytics</h3>
                    <div class="analytics-bars">
                        <div class="bar green" style="height: 60%;"></div>
                        <div class="bar yellow" style="height: 40%;"></div>
                        <div class="bar blue" style="height: 80%;"></div>
                        <div class="bar red" style="height: 50%;"></div>
                        <div class="bar green" style="height: 70%;"></div>
                        <div class="bar yellow" style="height: 30%;"></div>
                        <div class="bar blue" style="height: 90%;"></div>
                    </div>
                </div>
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin:0">Recent Projects</h3>
                        <button class="btn btn-primary" style="padding: 5px 12px; font-size: 11px;">+ New</button>
                    </div>
                    <div class="recent-list">
                         <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px;">
                              <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--gdg-blue);"></div>
                              <span style="font-size: 13px; font-weight: 500;">Develop API Endpoints</span>
                         </div>
                         <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px;">
                              <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--gdg-green);"></div>
                              <span style="font-size: 13px; font-weight: 500;">UI Refactor Design</span>
                         </div>
                    </div>
                </div>
            </div>

            <!-- ROW 3: TEAM & PROGRESS & TRACKER -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
                <div class="card">
                    <h3 style="margin-bottom: 15px;">Team Collaboration</h3>
                    <div class="team-list">
                        ${data.memberPerformances && data.memberPerformances.length > 0 ?
               data.memberPerformances.map(m => `
                                <div class="team-item">
                                    <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;">${m.displayName.charAt(0)}</div>
                                    <div style="flex: 1">
                                        <div style="font-size: 13px; font-weight: 600;">${m.displayName}</div>
                                        <div style="font-size: 11px; color: var(--text-light);">Active Member</div>
                                    </div>
                                    <span class="badge ${m.completedTasks > 0 ? 'badge-green' : 'badge-yellow'}">${m.completedTasks} tasks</span>
                                </div>
                            `).join('') : '<p style="font-size: 13px; color: var(--text-light);">No recent collaborators.</p>'}
                    </div>
                </div>

                <div class="card" style="text-align: center;">
                    <h3>Project Progress</h3>
                    <div style="margin: 20px auto; width: 140px; height: 140px; border-radius: 50%; background: conic-gradient(var(--gdg-green) ${data.overallCompletion || 0}%, #eee 0%); display: flex; align-items: center; justify-content: center;">
                        <div style="width: 110px; height: 110px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: var(--text-dark);">
                            ${data.overallCompletion || 0}%
                        </div>
                    </div>
                    <div style="font-size: 12px; color: var(--text-light);">Progress Overall</div>
                </div>

                <div class="card" style="background: #111; color: white; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <h3 style="color: rgba(255,255,255,0.7); font-size: 13px;">Time Tracker</h3>
                        <div id="timer-display" style="font-size: 32px; font-weight: 700; margin: 15px 0;">${formatTime(timerSeconds)}</div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button id="timer-toggle-btn" style="flex: 1; padding: 10px; border-radius: 8px; border: none; background: white; color: black; font-weight: 700; cursor: pointer;">
                            ${isTimerRunning ? '⏸' : '▶'}
                        </button>
                        <button id="timer-stop-btn" style="flex: 1; padding: 10px; border-radius: 8px; border: none; background: var(--gdg-red); color: white; font-weight: 700; cursor: pointer;">⏹</button>
                    </div>
                </div>
            </div>
        </div>
     `;
     content.innerHTML = html;

     // Timer handlers
     const toggleBtn = document.getElementById('timer-toggle-btn');
     const stopBtn = document.getElementById('timer-stop-btn');
     const timerDisplay = document.getElementById('timer-display');

     if (toggleBtn) {
          toggleBtn.addEventListener('click', () => {
               if (isTimerRunning) {
                    clearInterval(timerInterval);
                    isTimerRunning = false;
                    toggleBtn.textContent = '▶';
               } else {
                    isTimerRunning = true;
                    toggleBtn.textContent = '⏸';
                    timerInterval = setInterval(() => {
                         timerSeconds++;
                         if (timerDisplay) timerDisplay.textContent = formatTime(timerSeconds);
                    }, 1000);
               }
          });
     }

     if (stopBtn) {
          stopBtn.addEventListener('click', () => {
               clearInterval(timerInterval);
               isTimerRunning = false;
               timerSeconds = 0;
               if (timerDisplay) timerDisplay.textContent = formatTime(timerSeconds);
               if (toggleBtn) toggleBtn.textContent = '▶';
          });
     }
}


// project list and detail
let _allProjects = [];

async function loadProjects() {
     requireAuth();
     hideAdmin();
     const content = document.getElementById('content');
     content.innerHTML = `<div class="spinner"></div> Loading projects...`;
     try {
          const projects = (await apiRequest('/projects')) || [];
          _allProjects = projects;
          renderProjectList(projects);
     } catch (e) {
          content.innerHTML = `<p>Error: ${e.message}</p>`;
     }
}

function applyProjectFilters() {
     let filtered = _allProjects.slice();
     const search = document
          .getElementById('project-search')
          .value.toLowerCase();
     const status = document.getElementById('project-filter').value;
     if (search) {
          filtered = filtered.filter((p) =>
               p.name.toLowerCase().includes(search)
          );
     }
     if (status) {
          filtered = filtered.filter((p) => p.status === status);
     }
     renderProjectList(filtered);
}

function renderProjectList(projects) {
     const role = localStorage.getItem('role');
     let html = `<h2>Projects</h2>`;
     // filter/search controls
     html += `
        <div class="project-controls">
            <input type="text" id="project-search" placeholder="Search by name">
            <select id="project-filter">
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
            </select>
            ${role === 'ADMIN' ? '<button id="create-project" class="btn">Create Project</button>' : ''}
        </div>
    `;
     if (projects.length === 0) {
          html += `<p>No projects yet.</p>`;
          document.getElementById('content').innerHTML = html;
          return;
     }
     html += `
        <div class="table-container">
            <table class="project-table">
                <thead>
                    <tr><th>Name</th><th>Leader</th><th>Status</th><th>Date range</th><th>Actions</th></tr>
                </thead>
                <tbody>
    `;
     projects.forEach((p) => {
          html += `
            <tr data-id="${p.id}" class="fade-in">
                <td style="font-weight: 600;">${p.name}</td>
                <td>${p.leaderName || ''}</td>
                <td><span class="badge badge-${p.status === 'ACTIVE' ? 'blue' : 'green'}">${p.status}</span></td>
                <td>${p.startDate || ''} - ${p.endDate || ''}</td>
                <td>
                    <button class="btn btn-outline open-project">Open</button>
                    ${role === 'ADMIN' ? '<button class="btn btn-danger delete-project">Delete</button>' : ''}
                </td>
            </tr>
        `;
     });
     html += `</tbody></table></div>`;
     document.getElementById('content').innerHTML = html;
     // attach handlers for filter/search controls
     const searchBox = document.getElementById('project-search');
     const filterBox = document.getElementById('project-filter');
     if (searchBox) searchBox.addEventListener('input', applyProjectFilters);
     if (filterBox) filterBox.addEventListener('change', applyProjectFilters);
}

async function loadProjectDetail(id) {
     requireAuth();
     hideAdmin();
     const content = document.getElementById('content');
     content.innerHTML = `<div class="spinner"></div> Loading project...`;
     try {
          const project = await apiRequest(`/projects/${id}`);
          const tasks = (await apiRequest(`/projects/${id}/tasks`)) || [];
          renderProjectDetail(project, tasks);
     } catch (e) {
          content.innerHTML = `<p>Error: ${e.message}</p>`;
     }
}

function renderProjectDetail(project, tasks) {
     let html = `
        <div class="header">
            <h1>${project.name}</h1>
            <div class="buttons">
                <button class="btn btn-green" id="add-task-btn">Add Task</button>
            </div>
        </div>
        <p>${project.description || ''}</p>
        <p>Status: <span class="badge status-${project.status.toLowerCase()}">${project.status}</span></p>
        <div class="members-section">
            <h3>Members</h3>
            <ul>
    `;
     project.members.forEach((m) => {
          html += `<li><div class="avatar-circle"></div> ${m.name} (${m.role})</li>`;
     });
     html += `
            </ul>
        </div>
        <div class="tasks-section">
            <h3>Tasks</h3>
    `;
     if (tasks.length === 0) {
          html += `<p style="padding: 20px; color: var(--text-secondary);">No tasks yet.</p>`;
     } else {
          html += `
            <div class="table-container">
                <table class="task-table">
                    <thead>
                        <tr><th>Title</th><th>Assignee</th><th>Priority</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
        `;
          tasks.forEach((t) => {
               const priorityClass = t.priority === 'HIGH' ? 'badge-red' : t.priority === 'MEDIUM' ? 'badge-yellow' : 'badge-blue';
               const statusClass = t.status === 'DONE' ? 'badge-green' : t.status === 'IN PROGRESS' || t.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-yellow';
               html += `
            <tr data-id="${t.id}" class="fade-in">
                <td style="font-weight: 600;">${t.title}</td>
                <td>${t.assigneeName || ''}</td>
                <td><span class="badge ${priorityClass}">${t.priority}</span></td>
                <td>${t.deadline || ''}</td>
                <td><span class="badge ${statusClass}">${t.status}</span></td>
                <td style="display: flex; gap: 8px;">
                    <button class="btn btn-outline update-task">Update</button>
                    <button class="btn btn-danger delete-task">Delete</button>
                </td>
            </tr>
        `;
          });
          html += `</tbody></table></div>`;
     }
     html += `</div>`;
     document.getElementById('content').innerHTML = html;
     // attach add task button if available
     const addBtn = document.getElementById('add-task-btn');
     if (addBtn) {
          addBtn.addEventListener('click', () => {
               const title = prompt('Task title:');
               if (title) {
                    apiRequest(`/projects/${project.id}/tasks`, 'POST', {
                         title,
                    }).then(() => loadProjectDetail(project.id));
               }
          });
     }
}

async function loadTasks() {
     requireAuth();
     hideAdmin();
     const content = document.getElementById('content');
     content.innerHTML = `<div class="spinner"></div> Loading your tasks...`;
     try {
          const tasks = (await apiRequest('/tasks/my')) || [];
          renderTasks(tasks);
     } catch (e) {
          content.innerHTML = `<p>Error: ${e.message}</p>`;
     }
}

function renderTasks(tasks) {
     let html = `<div class="header"><h1>My Tasks</h1></div>`;
     if (tasks.length === 0) {
          html += `<p style="padding: 20px; color: var(--text-secondary);">You have no assigned tasks.</p>`;
     } else {
          html += `
            <div class="table-container">
                <table class="task-table">
                    <thead>
                        <tr><th>Title</th><th>Project</th><th>Priority</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
        `;
          tasks.forEach((t) => {
               const priorityClass = t.priority === 'HIGH' ? 'badge-red' : t.priority === 'MEDIUM' ? 'badge-yellow' : t.priority === 'LOW' ? 'badge-blue' : 'badge-gray';
               const statusClass = t.status === 'DONE' ? 'badge-green' : t.status === 'IN PROGRESS' || t.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-yellow';
               html += `
            <tr data-id="${t.id}" class="fade-in">
                <td style="font-weight: 600;">${t.title}</td>
                <td>${t.projectName || 'N/A'}</td>
                <td><span class="badge ${priorityClass}">${t.priority}</span></td>
                <td>${t.deadline || ''}</td>
                <td><span class="badge ${statusClass}">${t.status}</span></td>
                <td>
                    <button class="btn btn-outline update-task">Update</button>
                </td>
            </tr>
        `;
          });
          html += `</tbody></table></div>`;
     }
     document.getElementById('content').innerHTML = html;
}

function loadProfile() {
     requireAuth();
     const content = document.getElementById('content');
     content.innerHTML = `<div class="spinner"></div> Loading profile...`;
     apiRequest('/users/me').then((user) => {
          content.innerHTML = `
            <div class="header"><h1>Profile</h1></div>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <button class="btn btn-green" id="logout-btn">Logout</button>
        `;
          document
               .getElementById('logout-btn')
               .addEventListener('click', logout);
     });
}

// initialization
function init() {
     function activateLink(id) {
          document
               .querySelectorAll('.nav-link')
               .forEach((a) => a.classList.remove('active'));
          const el = document.getElementById(id);
          if (el) el.classList.add('active');
     }

     const navDashboard = document.getElementById('nav-dashboard');
     const navProjects = document.getElementById('nav-projects');
     const navProfile = document.getElementById('nav-profile');
     const navTasks = document.getElementById('nav-tasks');
     const logoutBtn = document.getElementById('logout');
     const sidebarToggle = document.getElementById('sidebar-toggle');

     if (navDashboard) navDashboard.addEventListener('click', () => {
          activateLink('nav-dashboard');
          loadDashboard();
     });
     if (navProjects) navProjects.addEventListener('click', () => {
          activateLink('nav-projects');
          loadProjects();
     });
     if (navProfile) navProfile.addEventListener('click', () => {
          activateLink('nav-profile');
          loadProfile();
     });
     if (navTasks) navTasks.addEventListener('click', () => {
          activateLink('nav-tasks');
          loadTasks();
     });
     if (logoutBtn) logoutBtn.addEventListener('click', logout);
     if (sidebarToggle) sidebarToggle.addEventListener('click', () => {
          document.getElementById('sidebar').classList.toggle('open');
     });

     // set default active nav link
     activateLink('nav-dashboard');

     const contentEl = document.getElementById('content');
     if (contentEl) {
          contentEl.addEventListener('click', (e) => {
               if (e.target.matches('.open-project')) {
                    const id = e.target.closest('tr').dataset.id;
                    localStorage.setItem('projectId', id);
                    loadProjectDetail(id);
               } else if (e.target.matches('.delete-project')) {
                    const id = e.target.closest('tr').dataset.id;
                    if (confirm('Delete project?')) {
                         apiRequest(`/projects/${id}`, 'DELETE').then(() =>
                              loadProjects()
                         );
                    }
               } else if (e.target.matches('#create-project')) {
                    const name = prompt('Project name:');
                    if (name) {
                         apiRequest('/projects', 'POST', { name }).then(() =>
                              loadProjects()
                         );
                    }
               } else if (e.target.matches('.delete-task')) {
                    const id = e.target.closest('tr').dataset.id;
                    if (confirm('Delete task?')) {
                         apiRequest(`/tasks/${id}`, 'DELETE').then(() => {
                              const pid = localStorage.getItem('projectId');
                              loadProjectDetail(pid);
                         });
                    }
               }
          });
     }

     // load dashboard by default
     loadDashboard();
}

// Execute init
if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', init);
} else {
     init();
}
