const API_BASE_URL = 'http://localhost:5001/api';

// Global state
let currentUserId = 'owner_1';
let projects = [];
let activeProject = null;
let systemUsers = [];

// DOM Elements
const userSelect = document.getElementById('current-user-select');
const customUserIdInput = document.getElementById('custom-user-id');
const btnApplyCustomUser = document.getElementById('btn-apply-custom-user');
const projectsListContainer = document.getElementById('projects-list-container');
const tabAllProjects = document.getElementById('tab-all-projects');
const tabMyProjects = document.getElementById('tab-my-projects');
const emptyProjectDetail = document.getElementById('empty-project-detail');
const activeProjectDetail = document.getElementById('active-project-detail');

// Project Hero Card Elements
const projectHeroCard = document.getElementById('project-hero-card');
const detailProjectName = document.getElementById('detail-project-name');
const detailProjectStatus = document.getElementById('detail-project-status');
const detailProjectDesc = document.getElementById('detail-project-desc');
const detailProjectDates = document.getElementById('detail-project-dates');
const detailProjectCreator = document.getElementById('detail-project-creator');
const detailProjectMembersCount = document.getElementById('detail-project-members-count');

// Navigation Tabs
const navTabs = document.querySelectorAll('.nav-tab');
const tabPanes = document.querySelectorAll('.tab-pane');

// Tab Contents Elements
const projectMembersTableBody = document.getElementById('project-members-table-body');
const sprintsGrid = document.getElementById('sprints-grid');
const milestonesList = document.getElementById('milestones-list');

// Forms & Modals Elements
const modalProject = document.getElementById('modal-project');
const formProject = document.getElementById('form-project');
const btnOpenCreateProject = document.getElementById('btn-open-create-project');
const projectStatusGroup = document.getElementById('project-status-group');

const modalAddMember = document.getElementById('modal-add-member');
const formAddMember = document.getElementById('form-add-member');
const btnOpenAddMember = document.getElementById('btn-open-add-member');
const memberSelect = document.getElementById('member-select');

const modalSprint = document.getElementById('modal-sprint');
const formSprint = document.getElementById('form-sprint');
const btnOpenCreateSprint = document.getElementById('btn-open-create-sprint');

const modalMilestone = document.getElementById('modal-milestone');
const formMilestone = document.getElementById('form-milestone');
const btnOpenCreateMilestone = document.getElementById('btn-open-create-milestone');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    loadSystemUsers().then(() => {
        loadProjects();
    });
});

// Theme Switching
function initTheme() {
    const btnThemeToggle = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-icon');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeIcon) {
        themeIcon.textContent = savedTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }

    if (btnThemeToggle) {
        btnThemeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            if (themeIcon) {
                themeIcon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
            }
            showToast('Giao diện', `Đã chuyển sang giao diện ${newTheme === 'dark' ? 'Tối' : 'Sáng'}`, 'success');
        });
    }
}

// Toast notification helper
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'check_circle';
    if (type === 'error') iconName = 'error';
    if (type === 'warning') iconName = 'warning';
    
    toast.innerHTML = `
        <span class="material-symbols-outlined toast-icon">${iconName}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove toast
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// API fetch wrapper with automatic headers injection
async function apiFetch(path, options = {}) {
    const url = `${API_BASE_URL}/${path}`;
    
    const headers = {
        'X-User-Id': currentUserId,
        ...(options.headers || {})
    };
    
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    
    const fetchOptions = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(url, fetchOptions);
        
        let result;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            result = await response.text();
        }
        
        if (!response.ok) {
            // Backend formatted ApiResponse error
            if (result && typeof result === 'object' && result.message) {
                throw new Error(result.message);
            }
            throw new Error(typeof result === 'string' ? result : `API Error (${response.status})`);
        }
        
        return result;
    } catch (error) {
        console.error(`API Fetch Error [${path}]:`, error);
        throw error;
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Current User select change
    userSelect.addEventListener('change', (e) => {
        currentUserId = e.target.value;
        customUserIdInput.value = '';
        showToast('Đổi vai trò', `Đã chuyển sang vai trò: ${currentUserId}`, 'warning');
        refreshCurrentView();
    });

    btnApplyCustomUser.addEventListener('click', () => {
        const val = customUserIdInput.value.trim();
        if (val) {
            currentUserId = val;
            // set value in dropdown to nothing or create a temporary option
            let opt = Array.from(userSelect.options).find(o => o.value === val);
            if (!opt) {
                opt = document.createElement('option');
                opt.value = val;
                opt.textContent = `${val} (Custom)`;
                userSelect.appendChild(opt);
            }
            userSelect.value = val;
            showToast('Đổi vai trò', `Đã chuyển sang vai trò tùy chọn: ${currentUserId}`, 'warning');
            refreshCurrentView();
        }
    });

    // Sidebar project filter tabs
    tabAllProjects.addEventListener('click', () => {
        tabAllProjects.classList.add('active');
        tabMyProjects.classList.remove('active');
        loadProjects(false);
    });

    tabMyProjects.addEventListener('click', () => {
        tabMyProjects.classList.add('active');
        tabAllProjects.classList.remove('active');
        loadProjects(true);
    });

    // Tab view navigation inside active project
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const paneId = tab.getAttribute('data-tab');
            document.getElementById(paneId).classList.add('active');
        });
    });

    // Modal open handlers
    btnOpenCreateProject.addEventListener('click', () => {
        document.getElementById('project-id-input').value = '';
        formProject.reset();
        document.getElementById('modal-project-title').textContent = 'Tạo dự án mới';
        projectStatusGroup.style.display = 'none';
        
        // set default dates: start is today, end is today + 3 months
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('project-start-date').value = today;
        
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
        document.getElementById('project-end-date').value = threeMonthsLater.toISOString().split('T')[0];
        
        document.getElementById('project-color').value = '#6366F1';
        document.querySelector('.color-text-val').textContent = '#6366F1';
        
        modalProject.style.display = 'grid';
    });

    btnOpenAddMember.addEventListener('click', () => {
        if (!activeProject) return;
        formAddMember.reset();
        modalAddMember.style.display = 'grid';
    });

    // Set default member display name when user selection changes
    memberSelect.addEventListener('change', (e) => {
        const userId = e.target.value;
        const selectedUser = systemUsers.find(u => u.id === userId);
        if (selectedUser) {
            document.getElementById('member-display-name').value = selectedUser.name;
            document.getElementById('member-email').value = selectedUser.email || '';
        }
    });

    btnOpenCreateSprint.addEventListener('click', () => {
        if (!activeProject) return;
        formSprint.reset();
        
        // Default sprint start is today, end is 14 days later
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('sprint-start-date').value = today;
        
        const end = new Date();
        end.setDate(end.getDate() + 14);
        document.getElementById('sprint-end-date').value = end.toISOString().split('T')[0];
        
        modalSprint.style.display = 'grid';
    });

    // Auto-update sprint end date to start + 14 days when start date changes
    document.getElementById('sprint-start-date').addEventListener('change', (e) => {
        const startVal = e.target.value;
        if (startVal) {
            const start = new Date(startVal);
            const end = new Date(start);
            end.setDate(end.getDate() + 14);
            document.getElementById('sprint-end-date').value = end.toISOString().split('T')[0];
        }
    });

    btnOpenCreateMilestone.addEventListener('click', () => {
        if (!activeProject) return;
        formMilestone.reset();
        
        // Default milestone due date is in 1 month (or project end date if sooner)
        const projectStart = new Date(activeProject.startDate);
        const defaultDue = new Date(projectStart);
        defaultDue.setMonth(defaultDue.getMonth() + 1);
        
        document.getElementById('milestone-due-date').value = defaultDue.toISOString().split('T')[0];
        modalMilestone.style.display = 'grid';
    });

    // Color picker display text sync
    document.getElementById('project-color').addEventListener('input', (e) => {
        document.querySelector('.color-text-val').textContent = e.target.value.toUpperCase();
    });

    // Modal close handlers
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = btn.getAttribute('data-modal');
            document.getElementById(modalId).style.display = 'none';
        });
    });

    // Form Submissions
    formProject.addEventListener('submit', handleProjectSubmit);
    formAddMember.addEventListener('submit', handleAddMemberSubmit);
    formSprint.addEventListener('submit', handleSprintSubmit);
    formMilestone.addEventListener('submit', handleMilestoneSubmit);

    // Active project Actions: Edit & Delete
    document.getElementById('btn-edit-project').addEventListener('click', openEditProjectModal);
    document.getElementById('btn-delete-project').addEventListener('click', deleteProject);
}

// Refresh view based on current tab filter & selected project
function refreshCurrentView() {
    loadProjects(tabMyProjects.classList.contains('active'));
    if (activeProject) {
        loadProjectDetails(activeProject.id);
    }
}

// System Users retrieval for dropdowns
async function loadSystemUsers() {
    try {
        systemUsers = await apiFetch('SystemUsers');
        
        // Populate current user select dropdown in header
        userSelect.innerHTML = '';
        
        // Add a default developer check role
        const defaultTestingUsers = [
            { id: 'owner_user_1', name: 'Nguyễn Văn A (Owner P1)' },
            { id: 'owner_user_2', name: 'Đỗ Minh Quân (Owner P2)' },
            { id: 'owner_user_3', name: 'Phan Thanh Hằng (Owner P3)' },
            { id: 'owner_user_4', name: 'Vũ Hoàng Nam (Owner P4)' },
            { id: 'owner_user_5', name: 'Lý Khánh Hòa (Owner P5)' },
            { id: 'admin', name: 'Nguyễn Văn Admin (System Admin)' },
            { id: 'duymanh', name: 'Nguyễn Duy Mạnh (Manager)' },
            { id: 'tranailinh', name: 'Trần Ái Linh (Member)' }
        ];

        // Combine default testing helpers with actual system users dynamically
        const addedIds = new Set();
        
        defaultTestingUsers.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = u.name;
            userSelect.appendChild(opt);
            addedIds.add(u.id);
        });

        systemUsers.forEach(user => {
            if (!addedIds.has(user.id)) {
                const opt = document.createElement('option');
                opt.value = user.id;
                opt.textContent = `${user.name} (${user.id})`;
                userSelect.appendChild(opt);
                addedIds.add(user.id);
            }
        });

        // Set default current user ID
        currentUserId = 'owner_user_1';
        userSelect.value = 'owner_user_1';
        
        // Populate memberSelect dropdown for Add Member Modal
        memberSelect.innerHTML = '<option value="">-- Chọn thành viên --</option>';
        systemUsers.forEach(user => {
            const opt = document.createElement('option');
            opt.value = user.id;
            opt.textContent = `${user.name} (${user.id})`;
            memberSelect.appendChild(opt);
        });
    } catch (e) {
        showToast('Lỗi hệ thống', 'Không thể tải danh sách người dùng hệ thống', 'error');
    }
}

// Projects list loader
async function loadProjects(myProjectsOnly = false) {
    try {
        const query = myProjectsOnly ? 'Projects?myProjects=true' : 'Projects';
        const res = await apiFetch(query);
        projects = res.data || [];
        
        renderProjectsList();
    } catch (e) {
        showToast('Lỗi tải dự án', e.message, 'error');
    }
}

// Render projects list in sidebar
function renderProjectsList() {
    if (projects.length === 0) {
        projectsListContainer.innerHTML = `
            <div class="empty-state" style="padding: 2rem 1rem;">
                <span class="material-symbols-outlined" style="font-size: 2rem;">folder_open</span>
                <p style="font-size: 0.8rem;">Không tìm thấy dự án nào</p>
            </div>
        `;
        return;
    }

    projectsListContainer.innerHTML = '';
    projects.forEach(proj => {
        const card = document.createElement('div');
        card.className = `project-card ${activeProject && activeProject.id === proj.id ? 'active-card' : ''}`;
        card.style.setProperty('--project-accent-color', proj.color || '#6366F1');
        card.setAttribute('data-id', proj.id);
        
        let statusClass = 'active';
        if (proj.status === 'Completed') statusClass = 'completed';
        if (proj.status === 'Archived') statusClass = 'archived';
        
        const startDateStr = new Date(proj.startDate).toLocaleDateString('vi-VN');
        const endDateStr = proj.endDate ? new Date(proj.endDate).toLocaleDateString('vi-VN') : 'Không hạn';

        card.innerHTML = `
            <div class="project-card-header">
                <span class="project-card-title">${escapeHTML(proj.name)}</span>
                <span class="status-badge ${statusClass}" style="font-size:0.6rem; padding:0.1rem 0.35rem;">${proj.status}</span>
            </div>
            <p class="project-card-desc">${escapeHTML(proj.description || 'Không có mô tả.')}</p>
            <div class="project-card-footer">
                <span style="font-size:0.7rem;">${startDateStr} - ${endDateStr}</span>
                <div class="project-card-stats">
                    <div class="stat-pill" title="Thành viên">
                        <span class="material-symbols-outlined">group</span>
                        ${proj.memberCount || 0}
                    </div>
                    <div class="stat-pill" title="Sprints">
                        <span class="material-symbols-outlined">bolt</span>
                        ${proj.sprintCount || 0}
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            document.querySelectorAll('.project-card').forEach(c => c.classList.remove('active-card'));
            card.classList.add('active-card');
            loadProjectDetails(proj.id);
        });

        // 3D Tilt Effect
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const xc = rect.width / 2;
            const yc = rect.height / 2;
            const dx = x - xc;
            const dy = y - yc;
            const rx = -(dy / yc) * 10;
            const ry = (dx / xc) * 10;
            card.style.setProperty('--rx', `${rx}deg`);
            card.style.setProperty('--ry', `${ry}deg`);
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });

        projectsListContainer.appendChild(card);
    });
}

// Project Details loader
async function loadProjectDetails(projectId) {
    try {
        const res = await apiFetch(`Projects/${projectId}`);
        activeProject = res.data;
        
        renderProjectDetails();
    } catch (e) {
        showToast('Lỗi xem dự án', e.message, 'error');
        emptyProjectDetail.style.display = 'flex';
        activeProjectDetail.style.display = 'none';
    }
}

// Render project details view
function renderProjectDetails() {
    if (!activeProject) return;

    emptyProjectDetail.style.display = 'none';
    activeProjectDetail.style.display = 'flex';

    // Hero card rendering
    detailProjectName.textContent = activeProject.name;
    detailProjectDesc.textContent = activeProject.description || 'Không có mô tả.';
    
    projectHeroCard.style.setProperty('--project-accent-color', activeProject.color || '#6366F1');
    
    let statusClass = 'active';
    if (activeProject.status === 'Completed') statusClass = 'completed';
    if (activeProject.status === 'Archived') statusClass = 'archived';
    
    detailProjectStatus.textContent = activeProject.status;
    detailProjectStatus.className = `status-badge ${statusClass}`;
    
    const startStr = new Date(activeProject.startDate).toLocaleDateString('vi-VN');
    const endStr = activeProject.endDate ? new Date(activeProject.endDate).toLocaleDateString('vi-VN') : 'Không hạn';
    detailProjectDates.textContent = `${startStr} - ${endStr}`;
    detailProjectCreator.textContent = activeProject.createdBy || 'Không rõ';
    detailProjectMembersCount.textContent = activeProject.memberCount;

    // Render tabs contents
    renderMembersTable();
    renderSprintsGrid();
    renderMilestonesList();
}

// 1. Render Members Tab
function renderMembersTable() {
    projectMembersTableBody.innerHTML = '';
    const members = activeProject.members || [];
    
    if (members.length === 0) {
        projectMembersTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
                    Dự án chưa có thành viên nào.
                </td>
            </tr>
        `;
        return;
    }

    members.forEach(member => {
        const tr = document.createElement('tr');
        const joinedDate = new Date(member.joinedAt).toLocaleDateString('vi-VN');
        
        // Define role options selection
        const roles = ['Owner', 'Manager', 'Member', 'Viewer'];
        let roleOptions = '';
        roles.forEach(r => {
            roleOptions += `<option value="${r}" ${member.role === r ? 'selected' : ''}>${r}</option>`;
        });

        tr.innerHTML = `
            <td>
                <div class="user-display-cell">
                    <span class="user-name">${escapeHTML(member.displayName)}</span>
                    <span class="user-id-sub">User ID: ${escapeHTML(member.userId)}</span>
                </div>
            </td>
            <td>${escapeHTML(member.email || '-')}</td>
            <td>
                <select class="role-select-inline" data-id="${member.id}" data-userid="${member.userId}">
                    ${roleOptions}
                </select>
            </td>
            <td>${joinedDate}</td>
            <td class="actions-col">
                <button class="btn-danger-sm btn-remove-member" data-id="${member.id}" title="Xóa khỏi dự án">
                    <span class="material-symbols-outlined" style="font-size:1.1rem;">person_remove</span> Xóa
                </button>
            </td>
        `;

        // Event listener: Inline role update
        const roleSelect = tr.querySelector('.role-select-inline');
        roleSelect.addEventListener('change', async (e) => {
            const memberId = e.target.getAttribute('data-id');
            const newRole = e.target.value;
            
            try {
                const res = await apiFetch(`projects/${activeProject.id}/Members/${memberId}`, {
                    method: 'PUT',
                    body: { role: newRole }
                });
                showToast('Thành công', res.message || 'Cập nhật vai trò thành công');
                loadProjectDetails(activeProject.id);
            } catch (err) {
                showToast('Lỗi phân quyền', err.message, 'error');
                // reset select to original role
                roleSelect.value = member.role;
            }
        });

        // Event listener: Remove member
        const removeBtn = tr.querySelector('.btn-remove-member');
        removeBtn.addEventListener('click', async () => {
            if (!confirm(`Bạn có chắc chắn muốn xóa thành viên "${member.displayName}" khỏi dự án này không?`)) {
                return;
            }
            try {
                const res = await apiFetch(`projects/${activeProject.id}/Members/${member.id}`, {
                    method: 'DELETE'
                });
                showToast('Thành công', res.message || 'Xóa thành viên thành công');
                loadProjectDetails(activeProject.id);
            } catch (err) {
                showToast('Lỗi nghiệp vụ', err.message, 'error');
            }
        });

        projectMembersTableBody.appendChild(tr);
    });
}

// 2. Render Sprints Tab
function renderSprintsGrid() {
    sprintsGrid.innerHTML = '';
    const sprints = activeProject.sprints || [];

    if (sprints.length === 0) {
        sprintsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">
                <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom:1rem; display:block;">bolt</span>
                Chưa có Sprint nào được tạo.
            </div>
        `;
        return;
    }

    // Sort sprints: Active first, then Planning, then Completed
    const sortedSprints = [...sprints].sort((a, b) => {
        const order = { 'Active': 1, 'Planning': 2, 'Completed': 3 };
        return order[a.status] - order[b.status];
    });

    sortedSprints.forEach(sprint => {
        const card = document.createElement('div');
        
        let sprintClass = '';
        if (sprint.status === 'Active') sprintClass = 'active-sprint';
        if (sprint.status === 'Completed') sprintClass = 'completed-sprint';
        
        card.className = `sprint-card ${sprintClass}`;
        
        const startStr = new Date(sprint.startDate).toLocaleDateString('vi-VN');
        const endStr = new Date(sprint.endDate).toLocaleDateString('vi-VN');

        let actionsHtml = '';
        if (sprint.status === 'Planning') {
            actionsHtml = `
                <button class="btn-success-sm btn-start-sprint" data-id="${sprint.id}">
                    <span class="material-symbols-outlined" style="font-size:1.1rem;">play_arrow</span> Bắt đầu
                </button>
            `;
        } else if (sprint.status === 'Active') {
            actionsHtml = `
                <button class="btn-danger-sm btn-complete-sprint" data-id="${sprint.id}">
                    <span class="material-symbols-outlined" style="font-size:1.1rem;">check_circle</span> Hoàn thành
                </button>
            `;
        }

        card.innerHTML = `
            <h4>${escapeHTML(sprint.name)}</h4>
            <p class="sprint-goal">${escapeHTML(sprint.goal || 'Không có mục tiêu cụ thể.')}</p>
            <div class="sprint-dates">
                <span class="material-symbols-outlined">calendar_today</span>
                <span>${startStr} - ${endStr}</span>
            </div>
            ${actionsHtml ? `<div class="sprint-actions">${actionsHtml}</div>` : ''}
        `;

        // Event listener: Start Sprint
        const startBtn = card.querySelector('.btn-start-sprint');
        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                try {
                    const res = await apiFetch(`projects/${activeProject.id}/Sprints/${sprint.id}/start`, {
                        method: 'PUT'
                    });
                    showToast('Thành công', res.message || 'Bắt đầu Sprint thành công. Event "sprint.started" đã được phát.');
                    loadProjectDetails(activeProject.id);
                } catch (err) {
                    showToast('Lỗi nghiệp vụ', err.message, 'error');
                }
            });
        }

        // Event listener: Complete Sprint
        const completeBtn = card.querySelector('.btn-complete-sprint');
        if (completeBtn) {
            completeBtn.addEventListener('click', async () => {
                try {
                    const res = await apiFetch(`projects/${activeProject.id}/Sprints/${sprint.id}/complete`, {
                        method: 'PUT'
                    });
                    showToast('Thành công', res.message || 'Hoàn thành Sprint thành công');
                    loadProjectDetails(activeProject.id);
                } catch (err) {
                    showToast('Lỗi nghiệp vụ', err.message, 'error');
                }
            });
        }

        sprintsGrid.appendChild(card);
    });
}

// 3. Render Milestones Tab
function renderMilestonesList() {
    milestonesList.innerHTML = '';
    const milestones = activeProject.milestones || [];

    if (milestones.length === 0) {
        milestonesList.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 3rem; position: relative;">
                <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom:1rem; display:block;">flag</span>
                Chưa có mốc quan trọng nào.
            </div>
        `;
        return;
    }

    milestones.forEach(milestone => {
        const item = document.createElement('div');
        item.className = `milestone-item ${milestone.isCompleted ? 'completed-milestone' : ''}`;
        
        const dueStr = new Date(milestone.dueDate).toLocaleDateString('vi-VN');

        item.innerHTML = `
            <div class="milestone-left">
                <div class="milestone-check" title="Đổi trạng thái hoàn thành">
                    <span class="material-symbols-outlined" style="font-size:1.1rem;">check</span>
                </div>
                <div class="milestone-info">
                    <h4>${escapeHTML(milestone.title)}</h4>
                    <p>${escapeHTML(milestone.description || 'Không có mô tả.')}</p>
                </div>
            </div>
            <div class="milestone-right">
                <div class="milestone-due">
                    <span class="material-symbols-outlined">schedule</span> Hạn: ${dueStr}
                </div>
                <button class="btn-action-icon btn-danger-icon btn-delete-milestone" data-id="${milestone.id}" title="Xóa Milestone">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;

        // Event listener: Toggle completion checkbox
        const check = item.querySelector('.milestone-check');
        check.addEventListener('click', async () => {
            try {
                const res = await apiFetch(`projects/${activeProject.id}/Milestones/${milestone.id}`, {
                    method: 'PUT',
                    body: {
                        title: milestone.title,
                        description: milestone.description,
                        dueDate: milestone.dueDate,
                        isCompleted: !milestone.isCompleted
                    }
                });
                showToast('Thành công', 'Đã cập nhật trạng thái Milestone');
                loadProjectDetails(activeProject.id);
            } catch (err) {
                showToast('Lỗi nghiệp vụ', err.message, 'error');
            }
        });

        // Event listener: Delete Milestone
        const deleteBtn = item.querySelector('.btn-delete-milestone');
        deleteBtn.addEventListener('click', async () => {
            if (!confirm(`Bạn có chắc chắn muốn xóa mốc "${milestone.title}" không?`)) {
                return;
            }
            try {
                const res = await apiFetch(`projects/${activeProject.id}/Milestones/${milestone.id}`, {
                    method: 'DELETE'
                });
                showToast('Thành công', 'Đã xóa Milestone');
                loadProjectDetails(activeProject.id);
            } catch (err) {
                showToast('Lỗi nghiệp vụ', err.message, 'error');
            }
        });

        milestonesList.appendChild(item);
    });
}

// Project Submit Handler (Create & Update)
async function handleProjectSubmit(e) {
    e.preventDefault();
    
    const projectId = document.getElementById('project-id-input').value;
    const name = document.getElementById('project-name').value;
    const description = document.getElementById('project-desc').value;
    const startDate = document.getElementById('project-start-date').value;
    const endDate = document.getElementById('project-end-date').value;
    const color = document.getElementById('project-color').value;
    const status = document.getElementById('project-status').value;
    
    // Validations
    if (endDate && new Date(endDate) < new Date(startDate)) {
        showToast('Lỗi nhập liệu', 'Ngày kết thúc phải sau ngày bắt đầu', 'error');
        return;
    }
    
    const body = {
        name,
        description,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        color
    };
    
    try {
        if (projectId) {
            // Update
            body.status = status;
            const res = await apiFetch(`Projects/${projectId}`, {
                method: 'PUT',
                body
            });
            showToast('Thành công', res.message || 'Cập nhật dự án thành công');
        } else {
            // Create
            const res = await apiFetch('Projects', {
                method: 'POST',
                body
            });
            showToast('Thành công', res.message || 'Tạo dự án thành công');
            // Select the newly created project
            if (res.data && res.data.id) {
                activeProject = res.data;
            }
        }
        
        modalProject.style.display = 'none';
        refreshCurrentView();
    } catch (err) {
        showToast('Lỗi thao tác', err.message, 'error');
    }
}

// Open Edit Project modal
function openEditProjectModal() {
    if (!activeProject) return;
    
    document.getElementById('project-id-input').value = activeProject.id;
    document.getElementById('project-name').value = activeProject.name;
    document.getElementById('project-desc').value = activeProject.description || '';
    
    document.getElementById('project-start-date').value = activeProject.startDate.split('T')[0];
    document.getElementById('project-end-date').value = activeProject.endDate ? activeProject.endDate.split('T')[0] : '';
    
    document.getElementById('project-color').value = activeProject.color || '#6366F1';
    document.querySelector('.color-text-val').textContent = (activeProject.color || '#6366F1').toUpperCase();
    
    document.getElementById('project-status').value = activeProject.status;
    projectStatusGroup.style.display = 'block';
    
    document.getElementById('modal-project-title').textContent = 'Chỉnh sửa dự án';
    modalProject.style.display = 'grid';
}

// Delete Project
async function deleteProject() {
    if (!activeProject) return;
    
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn dự án "${activeProject.name}"? Thao tác này sẽ xóa tất cả thành viên, sprints và milestones liên quan.`)) {
        return;
    }
    
    try {
        const res = await apiFetch(`Projects/${activeProject.id}`, {
            method: 'DELETE'
        });
        
        showToast('Thành công', 'Đã xóa dự án thành công');
        activeProject = null;
        emptyProjectDetail.style.display = 'flex';
        activeProjectDetail.style.display = 'none';
        refreshCurrentView();
    } catch (err) {
        showToast('Lỗi phân quyền', err.message, 'error');
    }
}

// Add Member Submit Handler
async function handleAddMemberSubmit(e) {
    e.preventDefault();
    if (!activeProject) return;

    const userId = memberSelect.value;
    const displayName = document.getElementById('member-display-name').value;
    const email = document.getElementById('member-email').value;
    const role = document.getElementById('member-role').value;

    try {
        const res = await apiFetch(`projects/${activeProject.id}/Members`, {
            method: 'POST',
            body: {
                userId,
                displayName,
                email: email || null,
                role
            }
        });

        showToast('Thành công', res.message || 'Thêm thành viên thành công. Event "project.member.added" đã được phát.');
        modalAddMember.style.display = 'none';
        loadProjectDetails(activeProject.id);
    } catch (err) {
        showToast('Lỗi thao tác', err.message, 'error');
    }
}

// Create Sprint Submit Handler
async function handleSprintSubmit(e) {
    e.preventDefault();
    if (!activeProject) return;

    const name = document.getElementById('sprint-name').value;
    const goal = document.getElementById('sprint-goal').value;
    const startDate = document.getElementById('sprint-start-date').value;
    const endDate = document.getElementById('sprint-end-date').value;

    // Dates bounds validation against project dates
    const projStart = new Date(activeProject.startDate);
    const sprintStart = new Date(startDate);
    const sprintEnd = new Date(endDate);
    
    if (sprintStart < projStart) {
        showToast('Lỗi ngày tháng', 'Ngày bắt đầu Sprint không được trước ngày bắt đầu dự án', 'error');
        return;
    }
    
    if (activeProject.endDate) {
        const projEnd = new Date(activeProject.endDate);
        if (sprintEnd > projEnd) {
            showToast('Lỗi ngày tháng', 'Ngày kết thúc Sprint không được sau ngày kết thúc dự án', 'error');
            return;
        }
    }

    try {
        const res = await apiFetch(`projects/${activeProject.id}/Sprints`, {
            method: 'POST',
            body: {
                name,
                goal,
                startDate: sprintStart.toISOString(),
                endDate: sprintEnd.toISOString()
            }
        });

        showToast('Thành công', res.message || 'Tạo Sprint thành công');
        modalSprint.style.display = 'none';
        loadProjectDetails(activeProject.id);
    } catch (err) {
        showToast('Lỗi nghiệp vụ', err.message, 'error');
    }
}

// Create Milestone Submit Handler
async function handleMilestoneSubmit(e) {
    e.preventDefault();
    if (!activeProject) return;

    const title = document.getElementById('milestone-title').value;
    const description = document.getElementById('milestone-desc').value;
    const dueDate = document.getElementById('milestone-due-date').value;

    // Date bounds validation
    const projStart = new Date(activeProject.startDate);
    const milestoneDue = new Date(dueDate);

    if (milestoneDue < projStart) {
        showToast('Lỗi ngày tháng', 'Ngày đến hạn Milestone không được trước ngày bắt đầu dự án', 'error');
        return;
    }

    if (activeProject.endDate) {
        const projEnd = new Date(activeProject.endDate);
        if (milestoneDue > projEnd) {
            showToast('Lỗi ngày tháng', 'Ngày đến hạn Milestone không được sau ngày kết thúc dự án', 'error');
            return;
        }
    }

    try {
        const res = await apiFetch(`projects/${activeProject.id}/Milestones`, {
            method: 'POST',
            body: {
                title,
                description,
                dueDate: milestoneDue.toISOString()
            }
        });

        showToast('Thành công', res.message || 'Tạo Milestone thành công');
        modalMilestone.style.display = 'none';
        loadProjectDetails(activeProject.id);
    } catch (err) {
        showToast('Lỗi nghiệp vụ', err.message, 'error');
    }
}

// HTML Escaper
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
