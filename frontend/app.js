/**
 * ScrumKanban Dashboard - API Connector & UI Logic
 * Communicates with Project & Member Service Web API
 */

const API_BASE_URL = 'http://localhost:5100';

// Global Application State
const state = {
    userId: 'owner_user_1',
    projects: [],
    selectedProjectId: null,
    activeProject: null,
    myProjectsOnly: false
};

// ==========================================================================
// API HELPER FUNCTIONS
// ==========================================================================

/**
 * Generic API request wrapper
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-User-Id': state.userId
    };

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const json = await response.json();
        
        if (!response.ok) {
            // Handle error response formatted as ApiResponse<T>
            throw new Error(json.message || `Lỗi hệ thống (${response.status})`);
        }
        return json; // Returns ApiResponse<T> wrapper
    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error);
        showToast(error.message || 'Không thể kết nối đến máy chủ Backend!', 'error');
        throw error;
    }
}

// ==========================================================================
// UTILITY HELPERS
// ==========================================================================

function formatDate(dateString) {
    if (!dateString) return 'Không xác định';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-xmark';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass} toast-icon"></i>
        <div class="toast-content">${message}</div>
        <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);

    // Close on click
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });

    // Auto remove after 4 seconds
    setTimeout(() => {
        removeToast(toast);
    }, 4000);
}

function removeToast(toast) {
    if (toast.classList.contains('removing')) return;
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => {
        toast.remove();
    });
}

// ==========================================================================
// BUSINESS OPERATIONS & API CALLS
// ==========================================================================

// --- Project Operations ---

async function fetchProjects() {
    const listElement = document.getElementById('project-list');
    listElement.innerHTML = '<li class="loading-item"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải dự án...</li>';

    try {
        const response = await apiRequest(`/api/Projects?myProjects=${state.myProjectsOnly}`);
        if (response.success) {
            state.projects = response.data || [];
            renderProjectList();
        }
    } catch (err) {
        listElement.innerHTML = '<li class="no-projects">Không tải được dự án.</li>';
    }
}

async function fetchProjectDetail(projectId) {
    try {
        const response = await apiRequest(`/api/Projects/${projectId}`);
        if (response.success) {
            state.activeProject = response.data;
            renderWorkspace();
        }
    } catch (err) {
        console.error('Error fetching project detail:', err);
    }
}

async function createProject(data) {
    try {
        const response = await apiRequest('/api/Projects', 'POST', data);
        if (response.success) {
            showToast('Tạo dự án thành công!');
            closeModal('modal-project');
            await fetchProjects();
            
            // Select the newly created project automatically
            if (response.data && response.data.id) {
                selectProject(response.data.id);
            }
        }
    } catch (err) {
        // Error toast already shown by helper
    }
}

async function updateProject(projectId, data) {
    try {
        const response = await apiRequest(`/api/Projects/${projectId}`, 'PUT', data);
        if (response.success) {
            showToast('Cập nhật dự án thành công!');
            closeModal('modal-project');
            await fetchProjects();
            await fetchProjectDetail(projectId);
        }
    } catch (err) {
        // Error toast handled
    }
}

async function deleteProject(projectId) {
    if (!confirm('Bạn có chắc chắn muốn xóa dự án này? Thao tác này không thể hoàn tác.')) {
        return;
    }
    try {
        const response = await apiRequest(`/api/Projects/${projectId}`, 'DELETE');
        if (response.success) {
            showToast('Đã xóa dự án thành công!');
            state.selectedProjectId = null;
            state.activeProject = null;
            document.getElementById('project-workspace').classList.add('hidden');
            document.getElementById('empty-state').classList.remove('hidden');
            await fetchProjects();
        }
    } catch (err) {
        // Error handled
    }
}

// --- Sprint Operations ---

async function createSprint(data) {
    try {
        const response = await apiRequest(`/api/projects/${state.selectedProjectId}/Sprints`, 'POST', data);
        if (response.success) {
            showToast('Tạo Sprint mới thành công!');
            closeModal('modal-sprint');
            await fetchProjectDetail(state.selectedProjectId);
        }
    } catch (err) {
        // Error handled
    }
}

async function startSprint(sprintId) {
    try {
        const response = await apiRequest(`/api/projects/${state.selectedProjectId}/Sprints/${sprintId}/start`, 'PUT');
        if (response.success) {
            showToast('Đã bắt đầu Sprint!');
            await fetchProjectDetail(state.selectedProjectId);
        }
    } catch (err) {
        // Error handled
    }
}

async function completeSprint(sprintId) {
    try {
        const response = await apiRequest(`/api/projects/${state.selectedProjectId}/Sprints/${sprintId}/complete`, 'PUT');
        if (response.success) {
            showToast('Đã hoàn thành Sprint!');
            await fetchProjectDetail(state.selectedProjectId);
        }
    } catch (err) {
        // Error handled
    }
}

// --- Milestone Operations ---

async function createMilestone(data) {
    try {
        const response = await apiRequest(`/api/projects/${state.selectedProjectId}/Milestones`, 'POST', data);
        if (response.success) {
            showToast('Tạo Milestone thành công!');
            closeModal('modal-milestone');
            await fetchProjectDetail(state.selectedProjectId);
        }
    } catch (err) {
        // Error handled
    }
}

async function toggleMilestone(milestoneId, isCompleted, title, description, dueDate) {
    try {
        const data = {
            title,
            description,
            dueDate,
            isCompleted
        };
        const response = await apiRequest(`/api/projects/${state.selectedProjectId}/Milestones/${milestoneId}`, 'PUT', data);
        if (response.success) {
            showToast(isCompleted ? 'Đã hoàn thành mốc thời gian!' : 'Đã mở lại mốc thời gian!');
            await fetchProjectDetail(state.selectedProjectId);
        }
    } catch (err) {
        await fetchProjectDetail(state.selectedProjectId); // reload to reset visual state on failure
    }
}

async function deleteMilestone(milestoneId) {
    if (!confirm('Bạn có chắc chắn muốn xóa mốc thời gian này?')) return;
    try {
        const response = await apiRequest(`/api/projects/${state.selectedProjectId}/Milestones/${milestoneId}`, 'DELETE');
        if (response.success) {
            showToast('Đã xóa Milestone!');
            await fetchProjectDetail(state.selectedProjectId);
        }
    } catch (err) {
        // Error handled
    }
}

// --- Member Operations ---

async function addMember(data) {
    try {
        const response = await apiRequest(`/api/projects/${state.selectedProjectId}/Members`, 'POST', data);
        if (response.success) {
            showToast('Thêm thành viên mới thành công!');
            closeModal('modal-member');
            await fetchProjectDetail(state.selectedProjectId);
        }
    } catch (err) {
        // Error handled
    }
}

async function updateMemberRole(memberId, role) {
    try {
        const data = { role: parseInt(role) }; // map string/int appropriately
        const response = await apiRequest(`/api/projects/${state.selectedProjectId}/Members/${memberId}`, 'PUT', data);
        if (response.success) {
            showToast('Cập nhật vai trò thành viên thành công!');
            await fetchProjectDetail(state.selectedProjectId);
        }
    } catch (err) {
        await fetchProjectDetail(state.selectedProjectId); // reset UI status
    }
}

async function removeMember(memberId) {
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?')) return;
    try {
        const response = await apiRequest(`/api/projects/${state.selectedProjectId}/Members/${memberId}`, 'DELETE');
        if (response.success) {
            showToast('Đã xóa thành viên khỏi dự án!');
            await fetchProjectDetail(state.selectedProjectId);
        }
    } catch (err) {
        // Error handled
    }
}

// ==========================================================================
// UI RENDERING FUNCTIONS
// ==========================================================================

function selectProject(projectId) {
    state.selectedProjectId = projectId;
    
    // Highlight sidebar active project
    const items = document.querySelectorAll('.project-item');
    items.forEach(item => {
        if (item.dataset.id === projectId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    document.getElementById('empty-state').classList.add('hidden');
    const workspace = document.getElementById('project-workspace');
    workspace.classList.remove('hidden');
    
    fetchProjectDetail(projectId);
}

function renderProjectList() {
    const listElement = document.getElementById('project-list');
    listElement.innerHTML = '';

    if (state.projects.length === 0) {
        listElement.innerHTML = '<li class="no-projects">Chưa có dự án nào.</li>';
        return;
    }

    state.projects.forEach(project => {
        const li = document.createElement('li');
        li.className = `project-item ${state.selectedProjectId === project.id ? 'active' : ''}`;
        li.dataset.id = project.id;
        
        const projectColor = project.color || '#3b82f6';
        
        li.innerHTML = `
            <div class="project-item-title-row">
                <span class="project-color-dot" style="background-color: ${projectColor}"></span>
                <span class="project-item-name">${escapeHtml(project.name)}</span>
            </div>
            <div class="project-item-meta">
                <span><i class="fa-solid fa-users"></i> ${project.memberCount}</span>
                <span><i class="fa-solid fa-rocket"></i> ${project.sprintCount}</span>
                <span class="status-indicator text-muted">${project.status}</span>
            </div>
        `;

        li.addEventListener('click', () => selectProject(project.id));
        listElement.appendChild(li);
    });
}

function renderWorkspace() {
    const p = state.activeProject;
    if (!p) return;

    // Title and Info
    document.getElementById('view-project-name').innerText = p.name;
    document.getElementById('view-project-desc').innerText = p.description || 'Không có mô tả cho dự án này.';
    document.getElementById('view-project-start').innerText = formatDate(p.startDate);
    document.getElementById('view-project-end').innerText = p.endDate ? formatDate(p.endDate) : 'Không giới hạn';
    document.getElementById('view-project-creator').innerText = p.createdBy;
    
    // Custom Accent Color of header border
    const header = document.querySelector('.workspace-header');
    if (header) {
        header.style.borderBottom = `2px solid ${p.color || 'var(--border-color)'}`;
    }

    // Status badge styling
    const statusBadge = document.getElementById('view-project-status');
    statusBadge.innerText = p.status;
    statusBadge.className = 'status-badge'; // reset
    if (p.status === 'Planning') statusBadge.classList.add('planning');
    if (p.status === 'Active') statusBadge.classList.add('active');
    if (p.status === 'Completed') statusBadge.classList.add('completed');

    // Enable/disable delete button based on owner role
    const deleteBtn = document.getElementById('btn-delete-project');
    if (p.createdBy === state.userId) {
        deleteBtn.removeAttribute('disabled');
        deleteBtn.title = "Xóa dự án";
    } else {
        // Let owner and manager delete, or keep enabled and rely on backend validation
        // In this system, Owner role is determined by backend based on initial creator.
        // Let's keep it active but backend will validate.
    }

    // Render Sprints List
    const sprintList = document.getElementById('sprint-list');
    sprintList.innerHTML = '';
    
    if (!p.sprints || p.sprints.length === 0) {
        sprintList.innerHTML = '<li class="no-items">Chưa có sprint nào được tạo.</li>';
    } else {
        // Sort sprints: Active first, then Planning, then Completed
        const statusOrder = { 'Active': 0, 'Planning': 1, 'Completed': 2 };
        const sortedSprints = [...p.sprints].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

        sortedSprints.forEach(s => {
            const li = document.createElement('li');
            li.className = `list-item ${s.status === 'Active' ? 'active-sprint' : ''}`;
            
            let actionBtnHtml = '';
            if (s.status === 'Planning') {
                actionBtnHtml = `<button class="text-btn btn-sprint-action" onclick="handleStartSprint('${s.id}')"><i class="fa-solid fa-play"></i> Bắt đầu</button>`;
            } else if (s.status === 'Active') {
                actionBtnHtml = `<button class="text-btn btn-sprint-complete" onclick="handleCompleteSprint('${s.id}')"><i class="fa-solid fa-circle-check"></i> Hoàn thành</button>`;
            }

            li.innerHTML = `
                <div class="item-main">
                    <div class="item-title-col">
                        <h3>${escapeHtml(s.name)}</h3>
                    </div>
                    <span class="item-badge-sprint ${s.status.toLowerCase()}">${s.status}</span>
                </div>
                <p class="item-desc">${escapeHtml(s.goal || 'Không có mục tiêu chi tiết.')}</p>
                <div class="item-footer-row">
                    <div class="item-dates">
                        <i class="fa-regular fa-calendar-days"></i>
                        <span>${formatDate(s.startDate)} - ${formatDate(s.endDate)}</span>
                    </div>
                    <div class="item-actions">
                        ${actionBtnHtml}
                    </div>
                </div>
            `;
            sprintList.appendChild(li);
        });
    }

    // Render Milestones List
    const milestoneList = document.getElementById('milestone-list');
    milestoneList.innerHTML = '';

    if (!p.milestones || p.milestones.length === 0) {
        milestoneList.innerHTML = '<li class="no-items">Chưa có mốc quan trọng nào.</li>';
    } else {
        // Sort by DueDate ascending
        const sortedMilestones = [...p.milestones].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        sortedMilestones.forEach(m => {
            const li = document.createElement('li');
            li.className = `list-item milestone-item ${m.isCompleted ? 'milestone-completed' : ''}`;
            
            const isOverdue = !m.isCompleted && new Date(m.dueDate) < new Date();
            const badgeClass = isOverdue ? 'milestone-due-badge overdue' : 'milestone-due-badge';

            li.innerHTML = `
                <div class="milestone-checkbox-col">
                    <label class="checkbox-custom">
                        <input type="checkbox" ${m.isCompleted ? 'checked' : ''} 
                            onclick="handleToggleMilestone('${m.id}', this.checked, '${escapeHtml(m.title)}', '${escapeHtml(m.description || '')}', '${m.dueDate}')">
                        <span class="checkbox-slider"></span>
                    </label>
                </div>
                <div class="milestone-content">
                    <div class="milestone-header-row">
                        <span class="milestone-title">${escapeHtml(m.title)}</span>
                        <button class="text-btn btn-item-delete" onclick="handleDeleteMilestone('${m.id}')" title="Xóa"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                    <p class="item-desc" style="margin-top: 4px; margin-bottom: 4px;">${escapeHtml(m.description || 'Không có mô tả.')}</p>
                    <div class="${badgeClass}">
                        <i class="fa-regular fa-clock"></i>
                        <span>Đến hạn: ${formatDate(m.dueDate)} ${isOverdue ? '(Quá hạn)' : ''}</span>
                    </div>
                </div>
            `;
            milestoneList.appendChild(li);
        });
    }

    // Render Members Table
    const memberBody = document.getElementById('member-table-body');
    memberBody.innerHTML = '';

    if (!p.members || p.members.length === 0) {
        memberBody.innerHTML = '<tr><td colspan="3" class="no-items">Không có thành viên.</td></tr>';
    } else {
        p.members.forEach(m => {
            const tr = document.createElement('tr');
            
            // Render Role badge
            const roleClass = m.role.toLowerCase();
            
            // Build action buttons (Manager/Owner can edit roles or kick members, except owner/self depending on API rules)
            // But we will generate options for dropdown to change roles for all roles except Owner
            let actionsHtml = '';
            if (m.role === 'Owner') {
                actionsHtml = '<span class="text-muted" style="font-size: 12px;">Chủ sở hữu</span>';
            } else {
                // Dropdown to edit role inline
                // MemberRole Enums in Backend: Owner = 0, Manager = 1, Member = 2, Viewer = 3
                const roleValueMap = { 'Owner': 0, 'Manager': 1, 'Member': 2, 'Viewer': 3 };
                const currentRoleValue = roleValueMap[m.role];
                
                actionsHtml = `
                    <div class="member-action-cell">
                        <select class="role-select-inline" onchange="handleUpdateMemberRole('${m.id}', this.value)">
                            <option value="1" ${currentRoleValue === 1 ? 'selected' : ''}>Manager</option>
                            <option value="2" ${currentRoleValue === 2 ? 'selected' : ''}>Member</option>
                            <option value="3" ${currentRoleValue === 3 ? 'selected' : ''}>Viewer</option>
                        </select>
                        <button class="text-btn btn-item-delete" onclick="handleRemoveMember('${m.id}')" title="Xóa thành viên">
                            <i class="fa-regular fa-circle-xmark"></i>
                        </button>
                    </div>
                `;
            }

            tr.innerHTML = `
                <td>
                    <div class="member-info-col">
                        <span class="member-name">${escapeHtml(m.displayName)}</span>
                        <span class="member-email">${escapeHtml(m.email || 'Không có email')}</span>
                        <span class="member-uid">ID: ${escapeHtml(m.userId)}</span>
                    </div>
                </td>
                <td>
                    <span class="member-role-badge ${roleClass}">${m.role}</span>
                </td>
                <td>
                    ${actionsHtml}
                </td>
            `;
            memberBody.appendChild(tr);
        });
    }
}

// Escapes raw strings to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

// ==========================================================================
// MODAL CONTROLLERS & EVENT ATTACHMENTS
// ==========================================================================

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
    // Clear inputs inside form
    const form = document.querySelector(`#${modalId} form`);
    if (form) form.reset();
}

// Attach action functions globally so they can be referenced inside template strings
window.handleStartSprint = startSprint;
window.handleCompleteSprint = completeSprint;
window.handleDeleteMilestone = deleteMilestone;
window.handleRemoveMember = removeMember;

window.handleToggleMilestone = function(id, checked, title, description, dueDate) {
    toggleMilestone(id, checked, title, description, dueDate);
};

window.handleUpdateMemberRole = function(memberId, roleValue) {
    updateMemberRole(memberId, roleValue);
};

// Initialize event handlers
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Data Fetch
    fetchProjects();

    // 2. Setup Role Switcher Widget
    const roleSelect = document.getElementById('user-role-select');
    const customUserContainer = document.getElementById('custom-user-input-container');
    const customUserIdInput = document.getElementById('custom-user-id');
    const roleDisplay = document.getElementById('current-user-display');

    roleSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'custom') {
            customUserContainer.classList.remove('hidden');
            state.userId = customUserIdInput.value || 'custom_user';
        } else {
            customUserContainer.classList.add('hidden');
            state.userId = val;
        }
        roleDisplay.innerText = `Đang đóng vai: ${state.userId}`;
        showToast(`Đã chuyển đổi sang phiên làm việc của: ${state.userId}`, 'warning');
        
        // Reload details to reflect actions validation based on new simulated role
        if (state.selectedProjectId) {
            fetchProjectDetail(state.selectedProjectId);
        }
    });

    customUserIdInput.addEventListener('input', (e) => {
        state.userId = e.target.value || 'custom_user';
        roleDisplay.innerText = `Đang đóng vai: ${state.userId}`;
    });

    // 3. My Projects Toggle
    const myProjectsToggle = document.getElementById('my-projects-toggle');
    myProjectsToggle.addEventListener('change', (e) => {
        state.myProjectsOnly = e.target.checked;
        fetchProjects();
    });

    // 4. Modal Triggers
    
    // Project modal handlers
    const openCreateProjBtn = document.getElementById('btn-open-create-project');
    const emptyStateProjBtn = document.getElementById('btn-empty-create-project');
    const openEditProjBtn = document.getElementById('btn-edit-project');
    
    const triggerCreateProjectModal = () => {
        document.getElementById('project-modal-title').innerText = "Tạo Dự Án Mới";
        document.getElementById('project-id-field').value = '';
        document.getElementById('project-status-group').classList.add('hidden');
        document.getElementById('btn-submit-project').innerText = "Tạo dự án";
        
        // Default dates: start today, end null
        document.getElementById('project-start-date').value = formatDateForInput(new Date());
        document.getElementById('project-end-date').value = '';
        document.getElementById('project-color').value = '#3b82f6';
        document.getElementById('project-color-picker').value = '#3b82f6';
        
        openModal('modal-project');
    };

    openCreateProjBtn.addEventListener('click', triggerCreateProjectModal);
    emptyStateProjBtn.addEventListener('click', triggerCreateProjectModal);

    openEditProjBtn.addEventListener('click', () => {
        const p = state.activeProject;
        if (!p) return;

        document.getElementById('project-modal-title').innerText = "Chỉnh sửa dự án";
        document.getElementById('project-id-field').value = p.id;
        document.getElementById('project-status-group').classList.remove('hidden');
        document.getElementById('btn-submit-project').innerText = "Cập nhật";

        document.getElementById('project-name').value = p.name;
        document.getElementById('project-desc').value = p.description || '';
        document.getElementById('project-start-date').value = formatDateForInput(p.startDate);
        document.getElementById('project-end-date').value = p.endDate ? formatDateForInput(p.endDate) : '';
        document.getElementById('project-color').value = p.color || '#3b82f6';
        document.getElementById('project-color-picker').value = p.color || '#3b82f6';
        document.getElementById('project-status').value = p.status;

        openModal('modal-project');
    });

    document.getElementById('btn-delete-project').addEventListener('click', () => {
        if (state.selectedProjectId) {
            deleteProject(state.selectedProjectId);
        }
    });

    // Sprint modal handlers
    document.getElementById('btn-open-create-sprint').addEventListener('click', () => {
        // Default start date today, end date today + 14 days
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 14);

        document.getElementById('sprint-start-date').value = formatDateForInput(start);
        document.getElementById('sprint-end-date').value = formatDateForInput(end);

        openModal('modal-sprint');
    });

    // Milestone modal handlers
    document.getElementById('btn-open-create-milestone').addEventListener('click', () => {
        // Default due date today + 7 days
        const due = new Date();
        due.setDate(due.getDate() + 7);
        document.getElementById('milestone-due-date').value = formatDateForInput(due);

        openModal('modal-milestone');
    });

    // Member modal handlers
    document.getElementById('btn-open-add-member').addEventListener('click', () => {
        openModal('modal-member');
    });

    // Color picker sync
    const colorInput = document.getElementById('project-color');
    const colorPicker = document.getElementById('project-color-picker');
    colorPicker.addEventListener('input', (e) => {
        colorInput.value = e.target.value;
    });
    colorInput.addEventListener('input', (e) => {
        if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
            colorPicker.value = e.target.value;
        }
    });

    // Close buttons on all modals
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const overlay = e.target.closest('.modal-overlay');
            if (overlay) {
                closeModal(overlay.id);
            }
        });
    });

    // 5. Form Submissions
    
    // Project Form
    document.getElementById('form-project').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('project-id-field').value;
        const data = {
            name: document.getElementById('project-name').value,
            description: document.getElementById('project-desc').value || null,
            startDate: new Date(document.getElementById('project-start-date').value).toISOString(),
            endDate: document.getElementById('project-end-date').value ? new Date(document.getElementById('project-end-date').value).toISOString() : null,
            color: document.getElementById('project-color').value || '#3b82f6'
        };

        if (id) {
            // Update
            data.status = document.getElementById('project-status').value;
            updateProject(id, data);
        } else {
            // Create
            createProject(data);
        }
    });

    // Sprint Form
    document.getElementById('form-sprint').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('sprint-name').value,
            goal: document.getElementById('sprint-goal').value || null,
            startDate: document.getElementById('sprint-start-date').value ? new Date(document.getElementById('sprint-start-date').value).toISOString() : null,
            endDate: document.getElementById('sprint-end-date').value ? new Date(document.getElementById('sprint-end-date').value).toISOString() : null
        };
        createSprint(data);
    });

    // Milestone Form
    document.getElementById('form-milestone').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            title: document.getElementById('milestone-title').value,
            description: document.getElementById('milestone-desc').value || null,
            dueDate: new Date(document.getElementById('milestone-due-date').value).toISOString()
        };
        createMilestone(data);
    });

    // Member Form
    document.getElementById('form-member').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            userId: document.getElementById('member-user-id').value,
            displayName: document.getElementById('member-display-name').value,
            email: document.getElementById('member-email').value || null,
            role: parseInt(document.getElementById('member-role').value === 'Manager' ? 1 : (document.getElementById('member-role').value === 'Viewer' ? 3 : 2))
        };
        addMember(data);
    });
});
