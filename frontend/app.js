import { apiRequest } from './api.js';
import { logout } from './auth.js';
import { auth } from './firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

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
     document.querySelectorAll('.admin-only').forEach((el) => {
          if (role === 'ADMIN') {
               el.style.display = 'block'; // Or flex/inline-block if needed, but anchor is block-like
          } else {
               el.style.display = 'none';
          }
     });
}

// simple client-side navigation
async function loadDashboard() {
     requireAuth();
     const role = localStorage.getItem('role');
     hideAdmin();
     const content = document.getElementById('content');
     content.innerHTML = `<div class="spinner"></div> Loading dashboard...`;

     try {
          let endpoint;
          if (role === 'ADMIN') endpoint = '/dashboard/admin';
          else if (role === 'LEADER') {
               const pid = localStorage.getItem('projectId');
               endpoint = pid && pid !== 'null' ? '/dashboard/leader/' + pid : '/dashboard/member';
          }
          else endpoint = '/dashboard/member';

          const rawData = await apiRequest(endpoint);
          console.log("Dashboard raw data:", rawData);
          const data = rawData || {};

          // Fetch dynamic recent items based on role
          if (role === 'MEMBER') {
               const myTasks = await apiRequest('/tasks/my');
               data.recentItems = (myTasks || []).slice(0, 3).map(t => ({ name: t.title, color: 'var(--gdg-blue)' }));
          } else {
               const projects = await apiRequest('/projects');
               data.recentItems = (projects || []).slice(0, 3).map(p => ({ id: p.id, name: p.name, color: 'var(--gdg-green)' }));

               // Fallback: Recalculate stats on frontend to ensure perfect match with project list
               if (role === 'ADMIN' && projects) {
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);

                    let activeCount = 0;
                    let upcomingCount = 0;
                    let overdueCount = 0;

                    projects.forEach(p => {
                         const cat = getProjectCategory(p, now);
                         if (cat === 'active') activeCount++;
                         else if (cat === 'upcoming') upcomingCount++;
                         else if (cat === 'overdue') overdueCount++;
                    });

                    data.activeProjects = activeCount;
                    data.upcomingProjects = upcomingCount;
                    data.overdueProjects = overdueCount;
                    data.totalProjects = projects.length;
                    console.log("Dashboard stats recalculated:", { activeCount, upcomingCount, overdueCount });
               }
          }

          renderDashboard(role, data);
     } catch (err) {
          console.error("Dashboard load failed:", err);
          content.innerHTML = `<p style="padding: 20px; color: var(--gdg-red);">Error: ${err.message}</p>`;
          document.body.style.visibility = 'visible';
     }
}

function renderDashboard(role, data) {
     const content = document.getElementById('content');

     // Update Header User Info
     const nameEl = document.getElementById('user-display-name');
     const emailEl = document.getElementById('user-display-email');
     if (nameEl) nameEl.textContent = localStorage.getItem('displayName') || 'User';
     if (emailEl) emailEl.textContent = localStorage.getItem('userEmail') || '';

     let html = `<div class="dashboard-grid fade-in">`;

     // --- ROW 1: STATS (Role Specific) ---
     html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px;">`;

     if (role === 'ADMIN') {
          html += `
                <div class="card card-stat accent-blue">
                    <h4>Tổng số dự án</h4>
                    <h2>${data.totalProjects || 0}</h2>
                </div>
                <div class="card card-stat accent-green">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="margin:0;">Dự án đang làm</h4>
                        <i class="fas fa-info-circle" style="color:var(--text-light); font-size:12px; cursor:help;" title="Dự án có ngày bắt đầu đã qua và chưa tới hạn kết thúc"></i>
                    </div>
                    <h2>${data.activeProjects || 0}</h2>
                </div>
                <div class="card card-stat accent-yellow">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="margin:0;">Dự án sắp tới</h4>
                        <i class="fas fa-info-circle" style="color:var(--text-light); font-size:12px; cursor:help;" title="Các dự án chuẩn bị đến ngày bắt đầu"></i>
                    </div>
                    <h2>${data.upcomingProjects || 0}</h2>
                </div>
                <div class="card card-stat accent-red">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="margin:0;">Các task bị trễ hạn</h4>
                        <i class="fas fa-info-circle" style="color:var(--text-light); font-size:12px; cursor:help;" title="Số lượng công việc đã quá hạn trong các dự án đang hoạt động"></i>
                    </div>
                    <h2>${data.overdueTasks || 0}</h2>
                </div>
          `;
     } else if (role === 'LEADER') {
          html += `
                <div class="card card-stat accent-blue"><h4>Công việc dự án</h4><h2>${data.totalTasks || 0}</h2></div>
                <div class="card card-stat accent-green"><h4>Đã hoàn thành</h4><h2>${data.completedTasks || 0}</h2></div>
                <div class="card card-stat accent-yellow"><h4>Đang làm</h4><h2>${data.inProgressTasks || 0}</h2></div>
                <div class="card card-stat accent-red"><h4>Việc trễ hạn</h4><h2>${data.overdueTasks || 0}</h2></div>
          `;
     } else { // MEMBER
          const totalMemberTasks = (data.completedTasks || 0) + (data.inProgressTasks || 0) + (data.todoTasks || 0) + (data.overdueTasks || 0);
          const successRate = totalMemberTasks > 0 ? Math.round((data.completedTasks / totalMemberTasks) * 100) : 0;
          html += `
                <div class="card card-stat accent-green"><h4>Việc hoàn thành</h4><h2>${data.completedTasks || 0}</h2></div>
                <div class="card card-stat accent-blue"><h4>Tỷ lệ thành công</h4><h2>${successRate}%</h2></div>
                <div class="card card-stat accent-yellow"><h4>Đang chờ</h4><h2>${data.inProgressTasks || 0}</h2></div>
                <div class="card card-stat accent-red"><h4>Trễ hạn</h4><h2>${data.overdueTasks || 0}</h2></div>
          `;
     }
     html += `</div>`;
     // --- ROW 2: ANALYTICS & RECENT (Chart.js) ---
     html += `<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 25px;">`;

     // Analytics Bar (Chart.js)
     let analyticsTitle = "System Analytics";
     let chartLabels = [];
     let chartValues = [];
     let chartColors = [];

     if (role === 'ADMIN') {
          analyticsTitle = "Phân phối hệ thống";
          chartLabels = ['Tổng số', 'Đang làm', 'Sắp tới', 'Quá hạn', 'Công việc'];
          chartValues = [data.totalProjects || 0, data.activeProjects || 0, data.upcomingProjects || 0, data.overdueProjects || 0, data.totalTasks || 0];
          chartColors = ['#4285F4', '#34A853', '#4285F4', '#EA4335', '#FBBC05'];
     } else {
          analyticsTitle = role === 'LEADER' ? "Dòng chảy công việc" : "Khối lượng công việc";
          chartLabels = ['Cần làm', 'Đang làm', 'Hoàn thành', 'Trễ hạn'];
          chartValues = [data.todoTasks || 0, data.inProgressTasks || 0, data.completedTasks || 0, data.overdueTasks || 0];
          chartColors = ['#4285F4', '#FBBC05', '#34A853', '#EA4335'];
     }

     html += `
          <div class="card">
               <h3 style="margin:0 0 10px 0">${analyticsTitle}</h3>
               <div style="height: 180px; position: relative;">
                    <canvas id="analyticsChart"></canvas>
               </div>
          </div>
     `;

     // Recent Widget
     html += `
          <div class="card">
               <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin:0">${role === 'MEMBER' ? 'My Recent Tasks' : 'Recent Projects'}</h3>
                    ${role === 'ADMIN' ? '<button class="btn btn-primary" id="add-project-btn" style="padding: 5px 12px; font-size: 11px;">+ New</button>' : ''}
               </div>
               <div class="recent-list">
                    ${data.recentItems && data.recentItems.length > 0 ?
               data.recentItems.map(item => `
                              <div class="recent-item" data-id="${item.id}" style="display: flex; gap: 10px; align-items: center; margin-bottom: 12px; cursor: pointer;">
                                   <div style="width: 8px; height: 8px; border-radius: 50%; background: ${item.color};"></div>
                                   <span style="font-size: 13px; font-weight: 500;">${item.name}</span>
                              </div>
                         `).join('') : '<p style="font-size: 13px; color: var(--text-light);">No recent items found.</p>'}
               </div>
          </div>
     `;
     html += `</div>`;

     // --- ROW 3: TEAM & PROGRESS & TRACKER ---
     html += `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">`;

     // Team / Collaboration
     const performances = role === 'ADMIN' ? (data.topContributors || []) : (data.memberPerformances || []);
     html += `
          <div class="card">
               <h3 style="margin-bottom: 20px;">${role === 'MEMBER' ? 'Top Collaborators' : 'Performance Rankings'}</h3>
               <div class="team-list">
                    ${performances.length > 0 ?
               performances.map(m => `
                                <div class="team-item" style="margin-bottom: 15px;">
                                     <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                          <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700;">${(m.displayName || 'U').charAt(0).toUpperCase()}</div>
                                          <div style="flex: 1; font-size: 13px; font-weight: 600;">${m.displayName || 'Unknown'}</div>
                                          <div style="font-size: 11px; font-weight: 700;">${m.contributionScore || 0} pts</div>
                                     </div>
                                     <div style="width: 100%; height: 4px; background: #eee; border-radius: 2px; overflow: hidden;">
                                          <div style="width: ${m.completionRate || 0}%; height: 100%; background: ${m.completionRate > 80 ? 'var(--gdg-green)' : (m.completionRate > 40 ? 'var(--gdg-yellow)' : 'var(--gdg-red)')};"></div>
                                     </div>
                                     <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                                          <span style="font-size: 10px; color: var(--text-light);">${m.completedTasks || 0} Done</span>
                                          <span style="font-size: 10px; color: var(--text-light);">${Math.round(m.completionRate || 0)}%</span>
                                     </div>
                                </div>
                          `).join('') : '<p style="font-size: 13px; color: var(--text-light);">No performance data available.</p>'}
               </div>
          </div>
     `;

     // Progress Doughnut Chart (Chart.js)
     let progressTitle = "Global Progress";
     if (role === 'LEADER') progressTitle = "Project Delivery";
     else if (role === 'MEMBER') progressTitle = "Personal Goal";

     const progress = role === 'ADMIN' ? (data.overallCompletion || 0) :
          (data.totalTasks ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0);

     html += `
          <div class="card" style="text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center;">
               <h3>${progressTitle}</h3>
               <div style="width: 160px; height: 160px; margin: 10px auto; position: relative;">
                    <canvas id="progressChart"></canvas>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 28px; font-weight: 800; color: var(--text-dark);">
                         ${Math.round(progress)}<span style="font-size: 14px; font-weight: 600;">%</span>
                    </div>
               </div>
               <div style="font-size: 12px; color: var(--text-light); font-weight: 500;">
                    ${role === 'MEMBER' ? 'Target: 100% Achievement' :
               (role === 'ADMIN' ? 'Overall Completion Status' : 'Tasks Completed vs Total')}
               </div>
          </div>
     `;

     // Time Tracker
     html += `
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
     `;

     html += `</div></div>`;
     content.innerHTML = html;
     document.body.style.visibility = 'visible';

     // Handlers
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

     // Admin Add Project Handler
     if (role === 'ADMIN') {
          const addBtn = document.getElementById('add-project-btn');
          if (addBtn) {
               addBtn.addEventListener('click', () => showCreateProjectModal());
          }
     }

     // --- Chart.js: Analytics Bar Chart ---
     const analyticsCanvas = document.getElementById('analyticsChart');
     if (analyticsCanvas && typeof Chart !== 'undefined') {
          new Chart(analyticsCanvas, {
               type: 'bar',
               data: {
                    labels: chartLabels,
                    datasets: [{
                         data: chartValues,
                         backgroundColor: chartColors.map(c => c + 'CC'),
                         borderColor: chartColors,
                         borderWidth: 2,
                         borderRadius: 8,
                         borderSkipped: false
                    }]
               },
               options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                         legend: { display: false }
                    },
                    scales: {
                         y: {
                              beginAtZero: true,
                              ticks: { precision: 0, font: { size: 11 } },
                              grid: { color: 'rgba(0,0,0,0.05)' }
                         },
                         x: {
                              ticks: { font: { size: 11 } },
                              grid: { display: false }
                         }
                    },
                    animation: {
                         duration: 800,
                         easing: 'easeOutQuart'
                    }
               }
          });
     }

     // --- Chart.js: Progress Doughnut Chart ---
     const progressCanvas = document.getElementById('progressChart');
     if (progressCanvas && typeof Chart !== 'undefined') {
          const gaugeColor = progress > 75 ? '#34A853' : (progress > 40 ? '#FBBC05' : '#EA4335');
          new Chart(progressCanvas, {
               type: 'doughnut',
               data: {
                    datasets: [{
                         data: [progress, 100 - progress],
                         backgroundColor: [gaugeColor, '#f0f0f0'],
                         borderWidth: 0
                    }]
               },
               options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '75%',
                    plugins: {
                         legend: { display: false },
                         tooltip: { enabled: false }
                    },
                    animation: {
                         animateRotate: true,
                         duration: 1000,
                         easing: 'easeOutQuart'
                    }
               }
          });
     }
}

async function showCreateProjectModal() {
     let users = [];
     try {
          users = await apiRequest('/users') || [];
     } catch (err) {
          console.error("Failed to fetch users for leader selection:", err);
     }

     const leaderOptions = users.map(u => `<option value="${u.id}">${u.displayName || u.email} (${u.role})</option>`).join('');

     const modal = document.createElement('div');
     modal.className = 'modal-overlay';
     modal.innerHTML = `
          <div class="modal-content" style="max-width: 500px; padding: 0; overflow: hidden;">
               <div class="modal-header" style="background: var(--bg-body); padding: 24px 30px; border-bottom: 1px solid var(--border-color); margin: 0; display: flex; align-items: center; gap: 12px;">
                    <div style="background: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; box-shadow: var(--shadow-sm); color: var(--gdg-blue); font-size: 18px;">
                         <i class="fas fa-folder-plus"></i>
                    </div>
                    <h2 style="margin: 0; font-size: 20px;">Tạo Project Mới</h2>
               </div>
               <div class="modal-body" style="padding: 30px;">
                    <div class="form-group">
                         <label>Tên Project <span style="color: red;">*</span></label>
                         <input type="text" id="modal-project-name" class="form-input" placeholder="Nhập tên project..." autofocus>
                    </div>
                    <div class="form-row" style="display: flex; gap: 16px; margin-bottom: 20px;">
                         <div class="form-group" style="flex: 1; margin-bottom: 0;">
                              <label>Ngày bắt đầu</label>
                              <input type="date" id="modal-project-start" class="form-input">
                         </div>
                         <div class="form-group" style="flex: 1; margin-bottom: 0;">
                              <label>Ngày kết thúc</label>
                              <input type="date" id="modal-project-end" class="form-input">
                         </div>
                    </div>
                    <div class="form-group">
                         <label>Leader Dự Án <span style="color: red;">*</span></label>
                         <select id="modal-project-leader" class="form-input">
                              <option value="">-- Chọn Leader --</option>
                              ${leaderOptions}
                         </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                         <label>Mô tả chi tiết</label>
                         <textarea id="modal-project-desc" class="form-input" style="height: 100px; resize: none;" placeholder="Project này về mảng nào?..."></textarea>
                    </div>
               </div>
               <div class="modal-footer" style="padding: 20px 30px; background: var(--bg-body); border-top: 1px solid var(--border-color); margin: 0; display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="btn" style="background: white; border: 1px solid var(--border-color); color: var(--text-dark);" id="modal-cancel-btn">Hủy bỏ</button>
                    <button class="btn btn-primary" id="modal-submit-btn"><i class="fas fa-plus"></i> Tạo Project</button>
               </div>
          </div>
     `;
     document.body.appendChild(modal);

     const close = () => modal.remove();
     modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
     document.getElementById('modal-cancel-btn').addEventListener('click', close);

     document.getElementById('modal-submit-btn').addEventListener('click', async () => {
          const name = document.getElementById('modal-project-name').value.trim();
          const description = document.getElementById('modal-project-desc').value.trim();
          const startDate = document.getElementById('modal-project-start').value;
          const endDate = document.getElementById('modal-project-end').value;
          const leaderId = document.getElementById('modal-project-leader').value;

          if (!name) return alert('Vui lòng nhập tên project.');
          if (!leaderId) return alert('Vui lòng chọn leader cho dự án.');
          if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
               return alert('Ngày kết thúc phải sau ngày bắt đầu.');
          }

          const payload = { name, description, leaderId };
          if (startDate) payload.startDate = startDate;
          if (endDate) payload.endDate = endDate;

          const btn = document.getElementById('modal-submit-btn');
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo...';

          try {
               await apiRequest('/projects', 'POST', payload);
               close();
               loadDashboard(); // Refresh both to be safe
               if (document.getElementById('nav-projects')?.classList.contains('active')) {
                    loadProjects();
               }
          } catch (err) {
               alert('Lỗi: ' + err.message);
               btn.disabled = false;
               btn.innerHTML = '<i class="fas fa-plus"></i> Tạo Project';
          }
     });
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
          ?.value.toLowerCase() || '';
     const categoryFilter = document.getElementById('project-filter')?.value || '';
     if (search) {
          filtered = filtered.filter((p) =>
               p.name.toLowerCase().includes(search) ||
               (p.leaderName && p.leaderName.toLowerCase().includes(search))
          );
     }
     if (categoryFilter) {
          const now = new Date();
          now.setHours(0, 0, 0, 0);
          filtered = filtered.filter(p => {
               const cat = getProjectCategory(p, now);
               return cat === categoryFilter;
          });
     }
     renderProjectList(filtered, true);
}

function getProjectCategory(project, now) {
     if (!now) {
          now = new Date();
          now.setHours(0, 0, 0, 0);
     }
     const startDate = project.startDate ? new Date(project.startDate) : null;
     const endDate = project.endDate ? new Date(project.endDate) : null;

     if (endDate && endDate < now) {
          return 'overdue'; // Quá hạn
     }
     if (startDate && startDate <= now && (!endDate || endDate >= now)) {
          return 'active'; // Đang thực hiện
     }
     return 'upcoming'; // Chưa tới hạn
}

function getDeadlineText(project, category) {
     const now = new Date();
     now.setHours(0, 0, 0, 0);
     const endDate = project.endDate ? new Date(project.endDate) : null;
     const startDate = project.startDate ? new Date(project.startDate) : null;

     if (category === 'overdue' && endDate) {
          const days = Math.floor((now - endDate) / (1000 * 60 * 60 * 24));
          return `Quá hạn ${days} ngày`;
     }
     if (category === 'active' && endDate) {
          const days = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
          return days === 0 ? 'Hết hạn hôm nay' : `Còn ${days} ngày`;
     }
     if (category === 'upcoming' && startDate) {
          const days = Math.floor((startDate - now) / (1000 * 60 * 60 * 24));
          return `Bắt đầu sau ${days} ngày`;
     }
     return '';
}

function sortByDeadline(projects) {
     return projects.sort((a, b) => {
          const endA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
          const endB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
          return endA - endB; // Nearest deadline first
     });
}

function renderProjectCard(p, role, category) {
     const deadlineText = getDeadlineText(p, category);
     const cardClass = category === 'active' ? 'card-active' : category === 'overdue' ? 'card-overdue' : 'card-upcoming';
     const badgeClass = category === 'active' ? 'deadline-active' : category === 'overdue' ? 'deadline-overdue' : 'deadline-upcoming';

     return `
          <div class="project-card ${cardClass} fade-in" data-id="${p.id}">
               <div class="project-card-top">
                    <h3 class="project-card-name">${p.name}</h3>
                    <span class="badge badge-${p.status === 'ACTIVE' ? 'blue' : p.status === 'COMPLETED' ? 'green' : p.status === 'ON_HOLD' ? 'yellow' : p.status === 'CANCELLED' ? 'gray' : 'purple'}" style="margin-left: 10px; white-space: nowrap;">${p.status === 'ON_HOLD' ? 'ON HOLD' : p.status}</span>
               </div>
               <div class="project-card-meta">
                    ${p.leaderName ? `<div class="meta-item"><i class="fas fa-user"></i> ${p.leaderName}</div>` : ''}
                    <div class="meta-item"><i class="fas fa-calendar-alt"></i> ${p.startDate || 'N/A'} → ${p.endDate || 'N/A'}</div>
                    ${p.description ? `<div class="meta-item"><i class="fas fa-align-left"></i> ${p.description.length > 60 ? p.description.substring(0, 60) + '...' : p.description}</div>` : ''}
               </div>
               <div class="project-card-footer">
                    ${deadlineText ? `<span class="deadline-badge ${badgeClass}"><i class="fas fa-clock"></i> ${deadlineText}</span>` : '<span></span>'}
                    <div class="card-actions">
                         <button class="btn btn-outline open-project">Mở</button>
                         ${role === 'ADMIN' ? '<button class="btn btn-danger delete-project" style="padding: 6px 14px; font-size: 12px;">Xóa</button>' : ''}
                    </div>
               </div>
          </div>
     `;
}

function renderCategorySection(title, dotColor, projects, role, category) {
     let html = `
          <div class="project-category">
               <div class="project-category-header">
                    <div class="category-dot" style="background: ${dotColor};"></div>
                    <span class="category-label">${title}</span>
                    <span class="category-count">${projects.length}</span>
               </div>
     `;
     if (projects.length === 0) {
          html += `<div class="project-empty-category">Không có project nào.</div>`;
     } else {
          html += `<div class="project-cards-grid">`;
          projects.forEach(p => {
               html += renderProjectCard(p, role, category);
          });
          html += `</div>`;
     }
     html += `</div>`;
     return html;
}

function renderProjectList(projects, isFiltering = false) {
     const role = localStorage.getItem('role');
     const now = new Date();
     now.setHours(0, 0, 0, 0);

     // Categorize projects
     const activeProjects = [];
     const overdueProjects = [];
     const upcomingProjects = [];

     projects.forEach(p => {
          const cat = getProjectCategory(p, now);
          if (cat === 'active') activeProjects.push(p);
          else if (cat === 'overdue') overdueProjects.push(p);
          else upcomingProjects.push(p);
     });

     // Sort within category by nearest deadline
     sortByDeadline(activeProjects);
     sortByDeadline(overdueProjects);
     sortByDeadline(upcomingProjects);

     // Preserve search value
     const prevSearch = isFiltering ? (document.getElementById('project-search')?.value || '') : '';
     const prevFilter = isFiltering ? (document.getElementById('project-filter')?.value || '') : '';

     let html = `
          <div class="header" style="margin-bottom: 20px;">
               <h1 style="margin: 0;">Projects</h1>
               ${role === 'ADMIN' ? '<button id="create-project" class="btn btn-create-project"><i class="fas fa-plus"></i> Tạo Project</button>' : ''}
          </div>
          <div class="project-controls">
               <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="project-search" placeholder="Tìm project hoặc leader..." value="${prevSearch}">
               </div>
               <select id="project-filter" class="filter-select">
                    <option value="" ${prevFilter === '' ? 'selected' : ''}>Tất cả</option>
                    <option value="active" ${prevFilter === 'active' ? 'selected' : ''}>Đang thực hiện</option>
                    <option value="overdue" ${prevFilter === 'overdue' ? 'selected' : ''}>Quá hạn</option>
                    <option value="upcoming" ${prevFilter === 'upcoming' ? 'selected' : ''}>Chưa tới hạn</option>
               </select>
          </div>
     `;

     if (projects.length === 0) {
          html += `<div class="project-empty-category">Không tìm thấy project nào.</div>`;
          document.getElementById('content').innerHTML = html;
          attachProjectHandlers();
          return;
     }

     // Render categories (only show non-empty ones, or all if no filter)
     const filterVal = prevFilter;
     if (!filterVal || filterVal === 'active') {
          if (activeProjects.length > 0 || !filterVal) {
               html += renderCategorySection('Đang thực hiện', 'var(--gdg-blue)', activeProjects, role, 'active');
          }
     }
     if (!filterVal || filterVal === 'overdue') {
          if (overdueProjects.length > 0 || !filterVal) {
               html += renderCategorySection('Quá hạn', 'var(--gdg-red)', overdueProjects, role, 'overdue');
          }
     }
     if (!filterVal || filterVal === 'upcoming') {
          if (upcomingProjects.length > 0 || !filterVal) {
               html += renderCategorySection('Chưa tới hạn', 'var(--gdg-green)', upcomingProjects, role, 'upcoming');
          }
     }

     document.getElementById('content').innerHTML = html;
     attachProjectHandlers();
}

function attachProjectHandlers() {
     // Attach search and filter handlers
     const searchBox = document.getElementById('project-search');
     const filterBox = document.getElementById('project-filter');
     if (searchBox) searchBox.addEventListener('input', applyProjectFilters);
     if (filterBox) filterBox.addEventListener('change', applyProjectFilters);

     // Open project detail on "Mở" button click
     document.querySelectorAll('.open-project').forEach(btn => {
          btn.addEventListener('click', (e) => {
               e.stopPropagation();
               const card = btn.closest('.project-card');
               if (card) loadProjectDetail(card.dataset.id);
          });
     });

     // Delete project on "Xóa" button click
     document.querySelectorAll('.delete-project').forEach(btn => {
          btn.addEventListener('click', async (e) => {
               e.stopPropagation();
               const card = btn.closest('.project-card');
               if (!card) return;
               if (!confirm('Bạn có chắc muốn xóa project này?')) return;
               try {
                    await apiRequest(`/projects/${card.dataset.id}`, 'DELETE');
                    loadProjects();
               } catch (err) {
                    alert('Error: ' + err.message);
               }
          });
     });

     // Click anywhere on project card to open detail
     document.querySelectorAll('.project-card').forEach(card => {
          card.addEventListener('click', () => {
               loadProjectDetail(card.dataset.id);
          });
     });

     // Create project button
     const createBtn = document.getElementById('create-project');
     if (createBtn) {
          createBtn.addEventListener('click', () => showCreateProjectModal());
     }
}

async function loadProjectDetail(id) {
     requireAuth();
     hideAdmin();
     const content = document.getElementById('content');
     content.innerHTML = `<div class="spinner"></div> Loading project...`;
     try {
          const project = await apiRequest(`/projects/${id}`);
          const tasks = (await apiRequest(`/tasks/project/${id}`)) || [];

          // Try to get members from leader dashboard if possible
          let members = [];
          try {
               const dash = await apiRequest(`/dashboard/leader/${id}`);
               if (dash && dash.memberPerformances) {
                    members = dash.memberPerformances.map(m => ({
                         id: m.userId,
                         name: m.displayName,
                         role: 'MEMBER' // Placeholder
                    }));
               }
          } catch (e) {
               console.warn("Could not load members (probably not leader/admin):", e.message);
          }

          project.members = members; // Attach to project object for renderer
          window.currentProjectMembers = members; // Cache for edit assignees modal
          renderProjectDetail(project, tasks);
     } catch (e) {
          content.innerHTML = `<p>Error: ${e.message}</p>`;
     }
}

function renderProjectDetail(project, tasks) {
     let html = `
        <div class="project-detail-header fade-in" style="background: white; padding: 30px; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); margin-bottom: 30px; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                <div>
                    <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 800; color: var(--gdg-dark);">${project.name}</h1>
                    <p style="margin: 0; color: var(--text-medium); font-size: 15px; line-height: 1.6; max-width: 800px;">${project.description || 'Làm việc cùng nhau hướng tới mục tiêu chung'}</p>
                </div>
                <button class="btn btn-primary" id="add-task-btn" style="padding: 12px 24px; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);">
                    <i class="fas fa-plus" style="margin-right: 8px;"></i> Add Task
                </button>
            </div>
            
            <div style="display: flex; gap: 24px; align-items: center; padding-top: 20px; border-top: 1px solid #f5f5f5;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 13px; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Status:</span>
                    <span class="badge status-${project.status.toLowerCase()}" style="padding: 4px 12px; font-size: 12px; font-weight: 600;">${project.status === 'ON_HOLD' ? 'ON HOLD' : project.status}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 13px; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Leader:</span>
                    <div style="display: flex; align-items: center; gap: 8px; background: #f8f9fa; padding: 4px 12px; border-radius: 20px; border: 1px solid #eee;">
                        <div style="width: 20px; height: 20px; border-radius: 50%; background: var(--gdg-blue); color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">
                            ${(project.leader?.displayName || 'L').charAt(0).toUpperCase()}
                        </div>
                        <strong id="project-leader-name" style="font-size: 13px; color: var(--text-dark);">${project.leader ? (project.leader.displayName || project.leader.email) : 'Chưa có'}</strong>
                        ${localStorage.getItem('role') === 'ADMIN' ? '<button class="btn-text" id="change-leader-btn" style="color: var(--gdg-blue); font-size: 11px; margin-left: 5px; font-weight: 600;">Thay đổi</button>' : ''}
                    </div>
                </div>
            </div>
        </div>

        <div class="members-section fade-in" style="margin-bottom: 40px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--gdg-dark);">
                    Team Members <span style="color: var(--text-light); font-weight: 400; font-size: 14px; margin-left: 8px;">(${(project.members || []).length})</span>
                </h3>
                <button class="btn btn-outline" id="add-member-btn" style="padding: 6px 16px; font-size: 12px; border-radius: var(--radius-sm);">
                    <i class="fas fa-user-plus" style="margin-right: 6px;"></i> Add Member
                </button>
            </div>
            <div class="member-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px;">
                ${(project.members || []).length > 0 ? project.members.map(m => `
                    <div class="member-card card" style="padding: 15px; display: flex; align-items: center; gap: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color); transition: var(--transition);">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px;">
                            ${(m.displayName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style="flex: 1; overflow: hidden;">
                            <div style="font-size: 14px; font-weight: 600; color: var(--gdg-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${m.displayName || m.name}</div>
                            <div style="font-size: 11px; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px;">${m.role || 'Member'}</div>
                        </div>
                        <button class="remove-member-btn" data-user-id="${m.id}" style="background: rgba(234, 67, 53, 0.1); border: none; color: var(--gdg-red); cursor: pointer; padding: 6px; border-radius: 6px; font-size: 12px; transition: var(--transition);">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `).join('') : '<p style="grid-column: 1/-1; color: var(--text-light); font-size: 13px; text-align: center; padding: 40px; background: white; border-radius: var(--radius-md); border: 1px dashed var(--border-color);">No members joined this team yet.</p>'}
            </div>
        </div>

        <div class="tasks-section fade-in" style="background: white; padding: 30px; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: var(--gdg-dark);">Project Tasks</h3>
                <div style="display: flex; gap: 10px;">
                    <div style="background: #f8f9fa; padding: 5px 15px; border-radius: 20px; font-size: 12px; color: var(--text-medium); border: 1px solid #eee;">
                        <strong>${tasks.length}</strong> Total
                    </div>
                    <div style="background: rgba(52, 168, 83, 0.1); padding: 5px 15px; border-radius: 20px; font-size: 12px; color: var(--gdg-green); border: 1px solid rgba(52, 168, 83, 0.2);">
                        <strong>${tasks.filter(t => t.status === 'DONE').length}</strong> Done
                    </div>
                </div>
            </div>
    `;

     sortTasksByStatus(tasks);

     if (tasks.length === 0) {
          html += `<p style="padding: 60px; text-align: center; color: var(--text-light); font-size: 15px;">
                <i class="fas fa-tasks" style="display: block; font-size: 40px; margin-bottom: 15px; opacity: 0.3;"></i>
                No tasks have been created for this project yet.
            </p>`;
     } else {
          html += `
          <div class="table-container">
               <table class="task-table">
                    <thead>
                         <tr>
                            <th>Title</th>
                            <th>Assignees</th>
                            <th>Priority</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th style="text-align: right;">Actions</th>
                         </tr>
                    </thead>
                    <tbody>
                         `;
          tasks.forEach((t) => {
               const priorityClass = t.priority === 'HIGH' ? 'badge-red' : t.priority === 'MEDIUM' ? 'badge-yellow' : 'badge-blue';
               const statusClass = t.status === 'DONE' ? 'status-completed' : (t.status === 'IN_PROGRESS' || t.status === 'IN PROGRESS' ? 'status-active' : 'status-pending');

               html += `
                         <tr data-id="${t.id}" class="task-row">
                              <td style="font-weight: 600; color: var(--gdg-dark); padding: 16px;">${t.title}</td>
                              <td>
                                   ${t.assignees && t.assignees.length > 0 ?
                         `<div style="display: flex; gap: -8px; flex-wrap: wrap;">
                            ${t.assignees.map(a => `<div title="${a.displayName || a.email || 'User'}" style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; border: 2px solid white; font-size: 11px; margin-left: -8px; box-shadow: var(--shadow-sm);">${(a.displayName || a.email || 'U').charAt(0).toUpperCase()}</div>`).join('')}
                        </div>`
                         : '<span style="color: var(--text-light); font-size: 12px; font-style: italic;">Unassigned</span>'}
                              </td>
                              <td><span class="badge ${priorityClass}" style="padding: 4px 10px; font-size: 11px;">${t.priority}</span></td>
                              <td style="color: var(--text-medium); font-size: 13px;">${t.deadline ? new Date(t.deadline).toLocaleDateString() : '-'}</td>
                              <td>
                                   <select class="task-status-select ${statusClass}" data-task-id="${t.id}" style="padding: 6px 12px; border-radius: 20px; font-size: 11px; border: 1px solid #eee; background: #f8f9fa; cursor: pointer; font-weight: 600;">
                                        <option value="TODO" ${t.status === 'TODO' ? 'selected' : ''}>TODO</option>
                                        <option value="IN_PROGRESS" ${t.status === 'IN PROGRESS' || t.status === 'IN_PROGRESS' ? 'selected' : ''}>IN PROGRESS</option>
                                        <option value="DONE" ${t.status === 'DONE' ? 'selected' : ''}>DONE</option>
                                   </select>
                              </td>
                              <td style="text-align: right;">
                                   <div style="display: flex; gap: 8px; justify-content: flex-end;">
                                        <button class="btn-icon edit-assignees-task" title="Assign Members" data-assignees='${JSON.stringify((t.assignees || []).map(a => a.id))}'>
                                            <i class="fas fa-user-plus"></i>
                                        </button>
                                        <button class="btn-icon btn-icon-danger delete-task" title="Delete Task">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                   </div>
                              </td>
                         </tr>
                         `;
          });
          html += `</tbody></table></div>`;
     }
     html += `</div>`;
     document.getElementById('content').innerHTML = html;

     // Handlers
     const addMemberBtn = document.getElementById('add-member-btn');
     if (addMemberBtn) {
          addMemberBtn.addEventListener('click', () => showAddMemberModal(project.id));
     }

     document.querySelectorAll('.remove-member-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
               const userId = btn.dataset.userId;
               if (confirm('Are you sure you want to remove this member from the project?')) {
                    try {
                         await apiRequest(`/projects/${project.id}/members/${userId}`, 'DELETE');
                         loadProjectDetail(project.id);
                    } catch (err) {
                         alert('Error: ' + err.message);
                    }
               }
          });
     });

     const addTaskBtn = document.getElementById('add-task-btn');
     if (addTaskBtn) {
          addTaskBtn.addEventListener('click', () => showAddTaskModal(project.id, project.members || []));
     }

     // Task status change, delete, and assign handlers would be attached elsewhere (init or list view)
     // but in project detail they need to be re-attached if content is replaced.
}

function showAddTaskModal(projectId, members) {
     const modal = document.createElement('div');
     modal.className = 'modal-overlay';
     modal.innerHTML = `
          <div class="modal-content" style="width: 500px;">
               <div class="modal-header">
                    <h2><i class="fas fa-plus-circle" style="color: var(--gdg-blue); margin-right: 10px;"></i>Create New Task</h2>
               </div>
               <div class="modal-body">
                    <div class="form-group">
                         <label>Task Title</label>
                         <input type="text" id="task-title" class="form-input" placeholder="What needs to be done?" autofocus>
                    </div>
                    <div class="form-group">
                         <label>Description</label>
                         <textarea id="task-desc" class="form-input" style="height: 80px; resize: none;" placeholder="Add more details..."></textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                         <div class="form-group">
                              <label>Priority</label>
                              <select id="task-priority" class="form-input">
                                   <option value="LOW">Low</option>
                                   <option value="MEDIUM" selected>Medium</option>
                                   <option value="HIGH">High</option>
                              </select>
                         </div>
                         <div class="form-group">
                              <label>Deadline</label>
                              <input type="date" id="task-deadline" class="form-input">
                         </div>
                    </div>
                    <div class="form-group">
                         <label>Assignees</label>
                         <select id="task-assignees" class="form-input" multiple size="4">
                              ${members.map(m => `<option value="${m.id}">${m.displayName || m.name || m.email}</option>`).join('')}
                         </select>
                         <small style="color: var(--text-light); display: block; margin-top: 5px;">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</small>
                    </div>
               </div>
               <div class="modal-footer">
                    <button class="btn" style="background: #eee;" id="task-cancel-btn">Cancel</button>
                    <button class="btn btn-primary" id="task-submit-btn">Create Task</button>
               </div>
          </div>
          `;
     document.body.appendChild(modal);

     const close = () => modal.remove();
     document.getElementById('task-cancel-btn').addEventListener('click', close);
     modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

     document.getElementById('task-submit-btn').addEventListener('click', async () => {
          const title = document.getElementById('task-title').value;
          const description = document.getElementById('task-desc').value;
          const priority = document.getElementById('task-priority').value;
          const deadline = document.getElementById('task-deadline').value;
          const assigneeSelect = document.getElementById('task-assignees');
          const assigneeIds = Array.from(assigneeSelect.selectedOptions).map(opt => opt.value);

          if (!title) return alert('Please enter a task title.');

          const btn = document.getElementById('task-submit-btn');
          btn.disabled = true;
          btn.textContent = 'Creating...';

          try {
               await apiRequest(`/tasks/project/${projectId}`, 'POST', {
                    title,
                    description,
                    priority,
                    deadline: deadline || null,
                    assigneeIds: assigneeIds.length > 0 ? assigneeIds : null
               });
               close();
               loadProjectDetail(projectId);
          } catch (err) {
               alert('Error: ' + err.message);
               btn.disabled = false;
               btn.textContent = 'Create Task';
          }
     });
}

function showEditAssigneesModal(taskId, members, currentAssigneeIds) {
     const modal = document.createElement('div');
     modal.className = 'modal-overlay';
     modal.innerHTML = `
          <div class="modal-content" style="width: 400px; animation: slideIn 0.3s ease;">
               <div class="modal-header">
                    <h2><i class="fas fa-user-edit" style="color: var(--gdg-green); margin-right: 10px;"></i>Phân công Task</h2>
               </div>
               <div class="modal-body">
                    <div class="form-group">
                         <label>Chọn thành viên chịu trách nhiệm</label>
                         <select id="edit-task-assignees" class="form-input" multiple size="6" style="padding: 10px;">
                              ${members.map(m => `<option value="${m.id}" ${currentAssigneeIds.includes(m.id) ? 'selected' : ''} style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${m.displayName || m.name || m.email}</option>`).join('')}
                         </select>
                         <small style="color: var(--text-light); display: block; margin-top: 5px;">Hold Ctrl (Windows) or Cmd (Mac) to select multiple</small>
                    </div>
               </div>
               <div class="modal-footer">
                    <button class="btn" style="background: #eee;" id="cancel-edit-assignees">Cancel</button>
                    <button class="btn btn-primary" id="save-assignees-btn">Save</button>
               </div>
          </div>
     `;

     document.body.appendChild(modal);

     const close = () => modal.remove();
     document.getElementById('cancel-edit-assignees').addEventListener('click', close);
     modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

     document.getElementById('save-assignees-btn').addEventListener('click', async () => {
          const assigneeSelect = document.getElementById('edit-task-assignees');
          const assigneeIds = Array.from(assigneeSelect.selectedOptions).map(opt => opt.value);

          const submitBtn = document.getElementById('save-assignees-btn');
          submitBtn.disabled = true;
          submitBtn.textContent = 'Saving...';

          try {
               const existingTask = await apiRequest(`/tasks/${taskId}`, 'GET');
               await apiRequest(`/tasks/${taskId}`, 'PUT', {
                    title: existingTask.title,
                    description: existingTask.description,
                    priority: existingTask.priority,
                    deadline: existingTask.deadline,
                    status: existingTask.status,
                    assigneeIds: assigneeIds.length > 0 ? assigneeIds : null
               });
               close();
               const projectId = localStorage.getItem('projectId');
               loadProjectDetail(projectId);
          } catch (err) {
               alert('Error updating assignees: ' + err.message);
               submitBtn.disabled = false;
               submitBtn.textContent = 'Save';
          }
     });
}

async function showAddMemberModal(projectId) {
     const modal = document.createElement('div');
     modal.className = 'modal-overlay';
     modal.innerHTML = `
          <div class="modal-content">
               <div class="modal-header">
                    <h2><i class="fas fa-user-plus" style="color: var(--gdg-green); margin-right: 10px;"></i>Add Project Member</h2>
               </div>
               <div class="modal-body">
                    <div id="member-loading" style="text-align: center; padding: 20px;">
                         <div class="spinner"></div>
                         <p style="margin-top: 10px; color: var(--text-light);">Fetching users...</p>
                    </div>
                    <div id="member-form" style="display: none;">
                         <p style="font-size: 13px; color: var(--text-medium); margin-bottom: 15px;">Search and select a user to join this project team.</p>
                         <div class="form-group">
                              <label>Select User</label>
                              <select id="user-to-add" class="form-input">
                                   <!-- Users will be loaded here -->
                              </select>
                         </div>
                         <button class="btn btn-primary" id="confirm-add-member" style="width: 100%; margin-top: 10px; background: var(--gdg-green);">
                              Add to Team
                         </button>
                    </div>
               </div>
               <div class="modal-footer">
                    <button class="btn" id="member-modal-cancel" style="background: #eee;">Cancel</button>
               </div>
          </div>
     `;
     document.body.appendChild(modal);

     const close = () => modal.remove();
     document.getElementById('member-modal-cancel').addEventListener('click', close);
     modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

     try {
          const users = await apiRequest('/users');
          document.getElementById('member-loading').style.display = 'none';
          document.getElementById('member-form').style.display = 'block';

          const select = document.getElementById('user-to-add');
          select.innerHTML = users.map(u => `<option value="${u.id}">${u.displayName || 'User'} (${u.email})</option>`).join('');

          document.getElementById('confirm-add-member').addEventListener('click', async () => {
               const userId = select.value;
               const btn = document.getElementById('confirm-add-member');
               btn.disabled = true;
               btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
               try {
                    await apiRequest(`/projects/${projectId}/members`, 'POST', { userId });
                    close();
                    loadProjectDetail(projectId);
               } catch (err) {
                    alert('Error: ' + err.message);
                    btn.disabled = false;
                    btn.textContent = 'Add to Team';
               }
          });
     } catch (err) {
          document.getElementById('member-loading').innerHTML = `<p style="color: var(--gdg-red);">Error: ${err.message}</p>`;
     }
}

let _allMyTasks = [];

function sortTasksByStatus(tasks) {
     const statusOrder = { 'IN_PROGRESS': 1, 'IN PROGRESS': 1, 'DONE': 2, 'TODO': 3 };
     tasks.sort((a, b) => {
          const orderA = statusOrder[a.status] || 99;
          const orderB = statusOrder[b.status] || 99;
          return orderA - orderB;
     });
}

function applyMyTaskFilters() {
     const search = document.getElementById('my-task-search').value.toLowerCase();
     const filter = document.getElementById('my-task-filter').value;

     let filtered = _allMyTasks.filter(t =>
          (t.projectName && t.projectName.toLowerCase().includes(search)) ||
          (t.title && t.title.toLowerCase().includes(search))
     );

     if (filter) {
          filtered = filtered.filter(t => t.status === filter || (filter === 'IN_PROGRESS' && t.status === 'IN PROGRESS'));
     }

     renderTasks(filtered, true);
}

async function loadTasks() {
     requireAuth();
     hideAdmin();
     const content = document.getElementById('content');
     content.innerHTML = `<div class="spinner"></div> Loading your tasks...`;
     try {
          const tasks = (await apiRequest('/tasks/my')) || [];
          _allMyTasks = tasks;
          renderTasks(tasks);
     } catch (e) {
          content.innerHTML = `<p>Error: ${e.message}</p>`;
     }
}

function renderTasks(tasks, isFiltering = false) {
     sortTasksByStatus(tasks);

     const prevSearch = isFiltering ? (document.getElementById('my-task-search')?.value || '') : '';
     const prevFilter = isFiltering ? (document.getElementById('my-task-filter')?.value || '') : '';

     let html = `
          <div class="header" style="margin-bottom: 20px;">
               <h1 style="margin: 0;">My Tasks</h1>
          </div>
          <div class="project-controls">
               <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="my-task-search" placeholder="Search by project or title..." value="${prevSearch}">
               </div>
               <select id="my-task-filter" class="filter-select">
                    <option value="" ${prevFilter === '' ? 'selected' : ''}>Tất cả trạng thái</option>
                    <option value="IN_PROGRESS" ${prevFilter === 'IN_PROGRESS' ? 'selected' : ''}>Đang làm</option>
                    <option value="DONE" ${prevFilter === 'DONE' ? 'selected' : ''}>Đã xong</option>
                    <option value="TODO" ${prevFilter === 'TODO' ? 'selected' : ''}>Chưa bắt đầu</option>
               </select>
          </div>
     `;

     if (tasks.length === 0) {
          html += `<div class="project-empty-category">Không tìm thấy task nào.</div>`;
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
               html += `
            <tr data-id="${t.id}" class="fade-in">
                <td style="font-weight: 600;">${t.title}</td>
                <td><span class="task-project-name">${t.projectName || 'N/A'}</span></td>
                <td><span class="badge ${priorityClass}">${t.priority}</span></td>
                <td>${t.deadline || ''}</td>
                <td>
                    <select class="task-status-select" data-task-id="${t.id}" style="padding: 4px; border-radius: 4px; font-size: 11px; border: 1px solid #ddd;">
                        <option value="TODO" ${t.status === 'TODO' ? 'selected' : ''}>TODO</option>
                        <option value="IN_PROGRESS" ${t.status === 'IN PROGRESS' || t.status === 'IN_PROGRESS' ? 'selected' : ''}>IN PROGRESS</option>
                        <option value="DONE" ${t.status === 'DONE' ? 'selected' : ''}>DONE</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-outline edit-assignees-task" data-assignees='${JSON.stringify((t.assignees || []).map(a => a.id))}'>Assign</button>
                </td>
            </tr>
        `;
          });
          html += `</tbody></table></div>`;
     }
     document.getElementById('content').innerHTML = html;

     // Attach filters
     const searchBox = document.getElementById('my-task-search');
     const filterBox = document.getElementById('my-task-filter');
     if (searchBox) searchBox.addEventListener('input', applyMyTaskFilters);
     if (filterBox) filterBox.addEventListener('change', applyMyTaskFilters);

     if (isFiltering && searchBox) {
          searchBox.focus();
     }
}

function loadProfile() {
     requireAuth();
     const content = document.getElementById('content');
     content.innerHTML = `<div class="spinner"></div> Loading profile...`;
     apiRequest('/users/me').then((user) => {
          content.innerHTML = `
            <div class="header"><h1>Profile</h1></div>
            <div class="card fade-in" style="max-width: 500px; margin: 0 auto; padding: 30px;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; margin: 0 auto 15px;">${(user.displayName || 'U').charAt(0)}</div>
                    <h2 id="profile-name-display">${user.displayName}</h2>
                    <p style="color: var(--text-light);">${user.email}</p>
                </div>
                
                <div class="form-group">
                    <label>Display Name</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="new-display-name" class="form-input" value="${user.displayName}">
                        <button class="btn btn-primary" id="update-name-btn">Update</button>
                    </div>
                </div>

                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p><strong>Role:</strong> <span class="badge badge-blue">${user.role}</span></p>
                    <button class="btn btn-danger" id="logout-btn" style="width: 100%; margin-top: 20px;">Logout</button>
                </div>
            </div>
        `;
          document.getElementById('logout-btn').addEventListener('click', logout);
          document.getElementById('update-name-btn').addEventListener('click', async () => {
               const newName = document.getElementById('new-display-name').value;
               if (!newName) return;
               const btn = document.getElementById('update-name-btn');
               btn.disabled = true;
               btn.textContent = 'Updating...';
               try {
                    await apiRequest('/users/me/name', 'PUT', { displayName: newName });
                    localStorage.setItem('displayName', newName); // Update local storage too
                    alert('Name updated successfully!');
                    loadProfile();
               } catch (err) {
                    alert('Error: ' + err.message);
                    btn.disabled = false;
                    btn.textContent = 'Update';
               }
          });
     });
}

let _allUsers = [];

async function loadUsers() {
     requireAuth();
     const role = localStorage.getItem('role');
     if (role !== 'ADMIN') return;

     const content = document.getElementById('content');
     content.innerHTML = `<div class="spinner"></div> Loading users...`;

     try {
          const users = (await apiRequest('/users')) || [];

          if (Array.isArray(users)) {
               // Sort users by role priority: ADMIN (0) > LEADER (1) > MEMBER (2)
               const rolePriority = { 'ADMIN': 0, 'LEADER': 1, 'MEMBER': 2 };
               users.sort((a, b) => {
                    const priorityA = rolePriority[a.role] !== undefined ? rolePriority[a.role] : 99;
                    const priorityB = rolePriority[b.role] !== undefined ? rolePriority[b.role] : 99;
                    if (priorityA !== priorityB) return priorityA - priorityB;
                    // Secondary sort by name if roles are same
                    return (a.displayName || "").localeCompare(b.displayName || "");
               });
          } else {
               console.warn("API returned non-array for users:", users);
               _allUsers = [];
               renderUserList([]);
               return;
          }

          _allUsers = users;
          renderUserList(users);
     } catch (e) {
          content.innerHTML = `<p>Error: ${e.message}</p>`;
     }
}

function applyUserFilters() {
     const search = document.getElementById('user-search').value.toLowerCase();
     const filtered = _allUsers.filter(u =>
          (u.displayName && u.displayName.toLowerCase().includes(search)) ||
          (u.email && u.email.toLowerCase().includes(search))
     );
     // Note: _allUsers is already sorted, so filtered will be too.
     renderUserList(filtered, true);
}

function renderUserList(users, isFiltering = false) {
     let html = `
          <div class="header">
               <h1>User Management</h1>
          </div>
          <div style="margin-bottom: 30px;">
               <div class="search-container" style="background: white; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
                    <i class="fas fa-search" style="color: var(--text-light);"></i>
                    <input type="text" id="user-search" placeholder="Search user by name or email...">
               </div>
          </div>
     `;

     if (users.length === 0) {
          html += `<div class="project-empty-category">No users found.</div>`;
     } else {
          html += `<div class="users-grid fade-in">`;
          users.forEach((u) => {
               const isMe = u.email === localStorage.getItem('userEmail');
               const avatarLabel = (u.displayName || 'U').charAt(0).toUpperCase();

               // Determine badge color for role
               let roleBadgeClass = 'badge-gray';
               if (u.role === 'ADMIN') roleBadgeClass = 'badge-red';
               else if (u.role === 'LEADER') roleBadgeClass = 'badge-blue';

               html += `
                    <div class="user-card" data-id="${u.id}">
                         <div class="user-card-header">
                              <div class="user-avatar">${avatarLabel}</div>
                              <div class="user-info">
                                   <h3 class="user-name">
                                        ${u.displayName || 'Unknown User'}
                                        ${isMe ? '<span style="color: var(--gdg-blue); font-weight: normal; font-size: 11px; background: rgba(var(--gdg-blue-rgb), 0.1); padding: 2px 6px; border-radius: 4px;">You</span>' : ''}
                                   </h3>
                                   <p class="user-email">${u.email}</p>
                              </div>
                         </div>
                         
                         <div class="user-card-footer">
                              <span class="badge ${roleBadgeClass}" style="min-width: 70px; text-align: center;">${u.role}</span>
                              <div class="role-control">
                                   <select class="role-select" ${isMe ? 'disabled' : ''}>
                                        <option value="MEMBER" ${u.role === 'MEMBER' ? 'selected' : ''}>Member</option>
                                        <option value="LEADER" ${u.role === 'LEADER' ? 'selected' : ''}>Leader</option>
                                        <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                                   </select>
                                   <button class="btn btn-primary update-role-btn" ${isMe ? 'disabled' : ''} style="padding: 6px 14px; font-size: 12px; border-radius: var(--radius-sm);">Lưu</button>
                              </div>
                         </div>
                    </div>
               `;
          });
          html += `</div>`;
     }

     document.getElementById('content').innerHTML = html;

     // Set search value if we are filtering
     const searchInput = document.getElementById('user-search');
     if (isFiltering) {
          const searchVal = document.getElementById('user-search-val-temp')?.value || '';
          searchInput.value = searchVal;
          searchInput.focus();
     }

     // Attach Search Handler
     searchInput.addEventListener('input', (e) => {
          // Store value temporarily to restore focus/value after re-render
          let temp = document.getElementById('user-search-val-temp');
          if (!temp) {
               temp = document.createElement('input');
               temp.id = 'user-search-val-temp';
               temp.type = 'hidden';
               document.body.appendChild(temp);
          }
          temp.value = e.target.value;
          applyUserFilters();
     });

     // Attach Handlers
     document.querySelectorAll('.update-role-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
               const card = e.target.closest('.user-card');
               const userId = card.dataset.id;
               const newRole = card.querySelector('.role-select').value;

               btn.disabled = true;
               btn.textContent = 'Updating...';

               try {
                    await apiRequest(`/users/${userId}/role`, 'PATCH', { role: newRole });
                    alert('User role updated successfully!');
                    loadUsers();
               } catch (err) {
                    alert('Error: ' + err.message);
                    btn.disabled = false;
                    btn.textContent = 'Update';
               }
          });
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
     const navUsers = document.getElementById('nav-users'); // Existing ID in HTML
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
     if (navUsers) navUsers.addEventListener('click', () => {
          activateLink('nav-users');
          loadUsers();
     });
     if (logoutBtn) logoutBtn.addEventListener('click', logout);
     if (sidebarToggle) sidebarToggle.addEventListener('click', () => {
          document.getElementById('sidebar').classList.toggle('open');
     });

     // set default active nav link
     activateLink('nav-dashboard');

     // load dashboard by default
     const contentEl = document.getElementById('content');
     if (contentEl) {
          contentEl.addEventListener('click', (e) => {
               if (e.target.matches('.open-project')) {
                    const id = e.target.closest('tr, .project-card').dataset.id;
                    localStorage.setItem('projectId', id);
                    loadProjectDetail(id);
               } else if (e.target.matches('.delete-project')) {
                    const id = e.target.closest('tr, .project-card').dataset.id;
                    if (confirm('Delete project?')) {
                         apiRequest(`/projects/${id}`, 'DELETE').then(() =>
                              loadProjects()
                         );
                    }
               } else if (e.target.matches('.recent-item') || e.target.closest('.recent-item')) {
                    const item = e.target.matches('.recent-item') ? e.target : e.target.closest('.recent-item');
                    const id = item.dataset.id;
                    if (id) {
                         localStorage.setItem('projectId', id);
                         loadProjectDetail(id);
                    }
               } else if (e.target.matches('#create-project')) {
                    showCreateProjectModal();
               } else if (e.target.id === 'change-leader-btn' || e.target.closest('#change-leader-btn')) {
                    const pid = localStorage.getItem('projectId');
                    if (pid) showChangeLeaderModal(pid);
               }
               else if (e.target.matches('.delete-task')) {
                    const id = e.target.closest('tr').dataset.id;
                    if (confirm('Delete task?')) {
                         apiRequest(`/tasks/${id}`, 'DELETE').then(() => {
                              const pid = localStorage.getItem('projectId');
                              if (pid) loadProjectDetail(pid);
                         }).catch(err => alert("Error deleting task: " + err.message));
                    }
               }
               else if (e.target.matches('.edit-assignees-task')) {
                    const id = e.target.closest('tr').dataset.id;
                    const assigneesStr = e.target.dataset.assignees;
                    const currentAssigneeIds = JSON.parse(assigneesStr || '[]');
                    const members = window.currentProjectMembers || [];
                    showEditAssigneesModal(id, members, currentAssigneeIds);
               }
          });
          contentEl.addEventListener('change', (e) => {
               if (e.target.matches('.task-status-select')) {
                    const taskId = e.target.dataset.taskId;
                    const newStatus = e.target.value;
                    console.log(`Updating task ${taskId} status to: ${newStatus}`);
                    e.target.disabled = true;
                    // Path is now standardized to /tasks/{id}/status using PUT for better compatibility
                    apiRequest(`/tasks/${taskId}/status`, 'PUT', { status: newStatus })
                         .then(() => {
                              console.log(`Task ${taskId} status updated successfully`);
                              e.target.disabled = false;
                         })
                         .catch(err => {
                              console.error(`Failed to update status for task ${taskId}:`, err);
                              alert('Error updating status: ' + err.message);
                              e.target.disabled = false;
                         });
               }
          });
     }
     // Wait for Firebase Auth to restore the user session before loading data
     const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe(); // Only need to listen once
          if (user) {
               // Refresh the token and store it
               const freshToken = await user.getIdToken(true);
               localStorage.setItem('accessToken', freshToken);
               loadDashboard();
          } else {
               // Not signed in — redirect to login
               localStorage.clear();
               window.location.href = 'index.html';
          }
     });
}

// Execute init
if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', init);
} else {
     init();
}

async function showChangeLeaderModal(projectId) {
     let users = [];
     try {
          users = await apiRequest('/users') || [];
     } catch (err) {
          console.error("Failed to fetch users for leader selection:", err);
     }

     const leaderOptions = users.map(u => `<option value="${u.id}">${u.displayName || u.email} (${u.role})</option>`).join('');

     const modal = document.createElement('div');
     modal.className = 'modal-overlay';
     modal.innerHTML = `
          <div class="modal-content" style="max-width: 400px; padding: 30px;">
               <h3>Thay đổi Leader Dự Án</h3>
               <div class="form-group" style="margin-top: 20px;">
                    <label>Chọn Leader Mới</label>
                    <select id="new-leader-select" class="form-input">
                         <option value="">-- Chọn Leader --</option>
                         ${leaderOptions}
                    </select>
               </div>
               <div class="modal-footer" style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px; padding: 0; background: none; border: none;">
                    <button class="btn" id="cancel-change-leader">Hủy</button>
                    <button class="btn btn-primary" id="submit-change-leader">Cập nhật</button>
               </div>
          </div>
     `;
     document.body.appendChild(modal);

     const close = () => modal.remove();
     document.getElementById('cancel-change-leader').onclick = close;
     document.getElementById('submit-change-leader').onclick = async () => {
          const leaderId = document.getElementById('new-leader-select').value;
          if (!leaderId) return alert('Vui lòng chọn leader!');

          const btn = document.getElementById('submit-change-leader');
          btn.disabled = true;
          btn.textContent = 'Đang lưu...';

          try {
               await apiRequest(`/projects/${projectId}`, 'PUT', { leaderId });
               close();
               loadProjectDetail(projectId);
          } catch (err) {
               alert('Lỗi: ' + err.message);
               btn.disabled = false;
               btn.textContent = 'Cập nhật';
          }
     };
}
