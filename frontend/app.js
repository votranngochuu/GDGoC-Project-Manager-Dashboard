import { apiRequest } from './api.js';
import { logout } from './auth.js';

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
               renderDashboard(role, data);
          })
          .catch((err) => {
               content.innerHTML = `<p>Error: ${err.message}</p>`;
          });
}

function renderDashboard(role, data) {
     const content = document.getElementById('content');
     // header area
     let html = `
         <div class="header">
             <h1>Dashboard</h1>
             <div class="buttons">
                 ${role === 'ADMIN' ? '<button class="btn btn-green" id="add-project-btn">Add Project</button>' : ''}
             </div>
         </div>
     `;
     if (role === 'ADMIN') {
          html += `
             <div class="grid">
                 <div class="card green-card">
                     <h3>Total Projects</h3>
                     <div class="big-number">${data.totalProjects}</div>
                 </div>
                 <div class="card">
                     <h3>Active Projects</h3>
                     <div class="big-number">${data.activeProjects}</div>
                 </div>
                 <div class="card">
                     <h3>Total Tasks</h3>
                     <div class="big-number">${data.totalTasks}</div>
                 </div>
                 <div class="card">
                     <h3>Overall Completion</h3>
                     <div class="big-number">${data.overallCompletion}%</div>
                 </div>
             </div>
          `;
     } else if (role === 'LEADER') {
          // calculate progress percent
          const progress = data.totalTasks
               ? Math.round((data.completedTasks / data.totalTasks) * 100)
               : 0;
          html += `
             <div class="grid">
                 <div class="card green-card">
                     <h3>Total Tasks</h3>
                     <div class="big-number">${data.totalTasks}</div>
                 </div>
                 <div class="card">
                     <h3>To-do</h3>
                     <div class="big-number">${data.todoTasks}</div>
                 </div>
                 <div class="card">
                     <h3>In Progress</h3>
                     <div class="big-number">${data.inProgressTasks}</div>
                 </div>
                 <div class="card">
                     <h3>Completed</h3>
                     <div class="big-number">${data.completedTasks}</div>
                 </div>
             </div>
             <div class="grid-2">
                 <div class="card">
                     <h3>Team Collaboration</h3>
                     ${
                          data.memberPerformances &&
                          data.memberPerformances.length > 0
                               ? data.memberPerformances
                                      .map(
                                           (m) => `
                         <div class="team-member">
                             ${m.displayName}
                             <span class="badge ${m.completedTasks === 0 ? 'pending' : m.completedTasks === m.totalTasks ? 'completed' : 'inprogress'}">${m.completedTasks}</span>
                         </div>
                     `
                                      )
                                      .join('')
                               : '<p>No members yet.</p>'
                     }
                 </div>
                 <div class="card">
                     <h3>Project Progress</h3>
                     <div class="progress">
                         <div class="circle">
                             <span>${progress}%</span>
                         </div>
                     </div>
                 </div>
             </div>
          `;
     } else {
          html += `
             <div class="grid">
                 <div class="card green-card">
                     <h3>Completed Tasks</h3>
                     <div class="big-number">${data.completedTasks}</div>
                 </div>
                 <div class="card">
                     <h3>To-do</h3>
                     <div class="big-number">${data.todoTasks}</div>
                 </div>
                 <div class="card">
                     <h3>In Progress</h3>
                     <div class="big-number">${data.inProgressTasks}</div>
                 </div>
                 <div class="card">
                     <h3>Overdue</h3>
                     <div class="big-number">${data.overdueTasks}</div>
                 </div>
             </div>
          `;
     }
     content.innerHTML = html;
     // attach add project handler if admin
     if (role === 'ADMIN') {
          const btn = document.getElementById('add-project-btn');
          if (btn)
               btn.addEventListener('click', () => {
                    const name = prompt('Project name:');
                    if (name) {
                         apiRequest('/projects', 'POST', { name }).then(
                              loadProjects
                         );
                    }
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
          const projects = await apiRequest('/projects');
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
        <div class="table-container"><table class="project-table">
            <thead>
                <tr><th>Name</th><th>Leader</th><th>Status</th><th>Date range</th><th>Actions</th></tr>
            </thead>
            <tbody>
    `;
     projects.forEach((p) => {
          html += `
            <tr data-id="${p.id}">
                <td class="project-name">${p.name}</td>
                <td>${p.leaderName || ''}</td>
                <td><span class="badge status-${p.status.toLowerCase()}">${p.status}</span></td>
                <td>${p.startDate || ''} - ${p.endDate || ''}</td>
                <td>
                    <button class="btn open-project">Open</button>
                    ${role === 'ADMIN' ? '<button class="btn delete-project">Delete</button>' : ''}
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
          const tasks = await apiRequest(`/projects/${id}/tasks`);
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
          html += `<p>No tasks yet.</p>`;
     } else {
          html += `
            <div class="table-container"><table class="task-table">
                <thead>
                    <tr><th>Title</th><th>Assignee</th><th>Priority</th><th>Deadline</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
        `;
          tasks.forEach((t) => {
               html += `
            <tr data-id="${t.id}">
                <td>${t.title}</td>
                <td>${t.assigneeName || ''}</td>
                <td><span class="badge priority-${t.priority.toLowerCase()}">${t.priority}</span></td>
                <td>${t.deadline || ''}</td>
                <td><span class="badge status-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span></td>
                <td><button class="btn update-task">Update</button><button class="btn delete-task">Delete</button></td>
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

// add navigation handlers and delegation
window.addEventListener('DOMContentLoaded', () => {
     function activateLink(id) {
          document
               .querySelectorAll('.menu a')
               .forEach((a) => a.classList.remove('active'));
          const el = document.getElementById(id);
          if (el) el.classList.add('active');
     }
     document.getElementById('nav-dashboard').addEventListener('click', () => {
          activateLink('nav-dashboard');
          loadDashboard();
     });
     document.getElementById('nav-projects').addEventListener('click', () => {
          activateLink('nav-projects');
          loadProjects();
     });
     document.getElementById('nav-profile').addEventListener('click', () => {
          activateLink('nav-profile');
          loadProfile();
     });
     document.getElementById('logout').addEventListener('click', logout);
     document.getElementById('sidebar-toggle').addEventListener('click', () => {
          document.getElementById('sidebar').classList.toggle('open');
     });
     // set default active nav link
     activateLink('nav-dashboard');
     document.getElementById('content').addEventListener('click', (e) => {
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
     // load dashboard by default
     loadDashboard();
});
