// TaskFlow Frontend SPA JavaScript client
// When deploying to production (e.g. Vercel), window.API_BASE_URL can be injected or set below
const API_BASE_URL = window.API_BASE_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://to-do-list-3rmi.onrender.com'
);

// Auth State
let token = localStorage.getItem('taskflow_token') || null;
let username = localStorage.getItem('taskflow_username') || null;

// Theme State
let currentTheme = localStorage.getItem('taskflow_theme') || 'dark';

// App State
let tasksState = [];
let activeView = 'list'; // 'list' or 'kanban'
let activeFilters = {
  search: '',
  status: '',
  priority: '',
  category: ''
};
let activeSort = 'due_date_asc';

// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');

// Forms & Tabs
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const tabLogin = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');

// Views
const listViewContainer = document.getElementById('list-view-container');
const kanbanViewContainer = document.getElementById('kanban-view-container');
const viewListBtn = document.getElementById('view-list-btn');
const viewKanbanBtn = document.getElementById('view-kanban-btn');

// Filter & Sort Controls
const tasksContainer = document.getElementById('tasks-container');
const emptyState = document.getElementById('empty-state');
const metricsContainer = document.getElementById('dashboard-metrics');
const quickAddForm = document.getElementById('quick-add-form');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const filterPriority = document.getElementById('filter-priority');
const filterCategory = document.getElementById('filter-category');
const sortBySelect = document.getElementById('sort-by');
const statusFilterBtns = document.querySelectorAll('.status-filters .filter-btn');
const headerDate = document.getElementById('header-date');
const toastAlert = document.getElementById('alert-toast');

// Modal Elements
const editModal = document.getElementById('edit-modal');
const closeModelBtn = document.getElementById('close-modal-btn');
const editTaskForm = document.getElementById('edit-task-form');
const editTaskIdInput = document.getElementById('edit-task-id');
const editTitleInput = document.getElementById('edit-title');
const editDescInput = document.getElementById('edit-description');
const editPriorityInput = document.getElementById('edit-priority');
const editCategoryInput = document.getElementById('edit-category');
const editDueDateInput = document.getElementById('edit-due-date');
const editCompletedInput = document.getElementById('edit-completed');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  // Set date header
  const options = { weekday: 'long', month: 'short', day: '2-digit' };
  headerDate.innerText = new Date().toLocaleDateString('en-US', options);

  // Initialize UI based on Auth State
  setupAuthUI();

  // Initialize Theme
  applyTheme(currentTheme);

  // Attach Theme Toggle Listeners
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  });

  // Attach Auth Listeners
  tabLogin.addEventListener('click', () => toggleAuthTabs('login'));
  tabSignup.addEventListener('click', () => toggleAuthTabs('signup'));
  loginForm.addEventListener('submit', handleLogin);
  signupForm.addEventListener('submit', handleSignup);
  logoutBtn.addEventListener('click', handleLogout);

  // Attach View Switcher Listeners
  viewListBtn.addEventListener('click', () => switchView('list'));
  viewKanbanBtn.addEventListener('click', () => switchView('kanban'));

  // Attach Tasks List Listeners
  quickAddForm.addEventListener('submit', handleQuickAddSubmit);
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
  clearFiltersBtn.addEventListener('click', clearAllFilters);
  filterPriority.addEventListener('change', handleFilterChange);
  filterCategory.addEventListener('change', handleFilterChange);
  
  sortBySelect.addEventListener('change', (e) => {
    activeSort = e.target.value;
    renderTasks(tasksState);
  });

  statusFilterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      statusFilterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeFilters.status = e.target.dataset.status;
      updateFilterUI();
      fetchTasks();
    });
  });

  // Drag and Drop columns initialization
  setupKanbanDragDrop();

  // Modal events
  closeModelBtn.addEventListener('click', hideEditModal);
  window.addEventListener('click', (e) => { if (e.target === editModal) hideEditModal(); });
  editTaskForm.addEventListener('submit', handleEditSubmit);
});

// Setup Auth view visibility
function setupAuthUI() {
  if (token) {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    userDisplay.innerText = username;
    loadData();
  } else {
    appContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    loginForm.reset();
    signupForm.reset();
  }
}

// Apply Theme to body
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  currentTheme = theme;
  localStorage.setItem('taskflow_theme', theme);
}

// Toggle Auth Screen Tabs
function toggleAuthTabs(tab) {
  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
  } else {
    tabSignup.classList.add('active');
    tabLogin.classList.remove('active');
    signupForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

// Handle login submission
async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('login-username').value.trim();
  const passwordInput = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password: passwordInput })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Invalid credentials');
    }

    const data = await response.json();
    token = data.token;
    username = data.username;
    localStorage.setItem('taskflow_token', token);
    localStorage.setItem('taskflow_username', username);

    showToast('Signed in successfully! Welcome.');
    setupAuthUI();
  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
    const card = document.querySelector('.auth-card');
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 400);
  }
}

// Handle signup submission
async function handleSignup(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('signup-username').value.trim();
  const passwordInput = document.getElementById('signup-password').value;
  const passwordConfInput = document.getElementById('signup-password-conf').value;

  if (passwordInput !== passwordConfInput) {
    showToast('Passwords do not match.', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: { username: usernameInput, password: passwordInput } })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.errors ? errData.errors.join(', ') : 'Registration failed');
    }

    const data = await response.json();
    token = data.token;
    username = data.username;
    localStorage.setItem('taskflow_token', token);
    localStorage.setItem('taskflow_username', username);

    showToast('Account created successfully!');
    setupAuthUI();
  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
    const card = document.querySelector('.auth-card');
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 400);
  }
}

// Handle Logout
function handleLogout() {
  token = null;
  username = null;
  localStorage.removeItem('taskflow_token');
  localStorage.removeItem('taskflow_username');
  setupAuthUI();
  showToast('Logged out successfully.');
}

// Switch view between List and Kanban
function switchView(view) {
  activeView = view;
  if (view === 'list') {
    viewListBtn.classList.add('active');
    viewKanbanBtn.classList.remove('active');
    listViewContainer.classList.remove('hidden');
    kanbanViewContainer.classList.add('hidden');
    document.getElementById('status-filter-wrapper').style.opacity = '1';
    document.getElementById('status-filter-wrapper').style.pointerEvents = 'auto';
  } else {
    viewKanbanBtn.classList.add('active');
    viewListBtn.classList.remove('active');
    listViewContainer.classList.add('hidden');
    kanbanViewContainer.classList.remove('hidden');
    // Disable status filter in Kanban view as columns separate status
    document.getElementById('status-filter-wrapper').style.opacity = '0.4';
    document.getElementById('status-filter-wrapper').style.pointerEvents = 'none';
  }
  renderTasks(tasksState);
}

// Load all dashboard data (tasks + metrics)
async function loadData() {
  if (!token) return;
  await Promise.all([
    fetchTasks(),
    fetchMetrics()
  ]);
}

// Fetch tasks with filters applied
async function fetchTasks() {
  if (!token) return;
  try {
    const queryParams = new URLSearchParams();
    if (activeFilters.search) queryParams.append('search', activeFilters.search);
    
    // Status filter only applies in list view
    if (activeFilters.status && activeView === 'list') {
      queryParams.append('status', activeFilters.status);
    }
    
    if (activeFilters.priority) queryParams.append('priority', activeFilters.priority);
    if (activeFilters.category) queryParams.append('category', activeFilters.category);

    const response = await fetch(`${API_BASE_URL}/tasks?${queryParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    
    tasksState = await response.json();
    renderTasks(tasksState);
  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
  }
}

// Fetch metrics summary
async function fetchMetrics() {
  if (!token) return;
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/metrics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch metrics');
    
    const metrics = await response.json();
    renderMetrics(metrics);
  } catch (error) {
    console.error(error);
  }
}

// Sort tasks based on current criteria
function sortTasks(tasks) {
  const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
  
  tasks.sort((a, b) => {
    switch (activeSort) {
      case 'due_date_asc':
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      case 'due_date_desc':
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date) - new Date(a.due_date);
      case 'priority_desc':
        return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
      case 'created_at_desc':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'title_asc':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
}

// Friendly due date helper
function formatFriendlyDueDate(dueDateStr, isCompleted) {
  if (!dueDateStr) return '';
  
  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  const isOverdue = diffDays < 0 && !isCompleted;
  
  let dateText = '';
  if (diffDays === 0) {
    dateText = '🔥 Today';
  } else if (diffDays === 1) {
    dateText = '📅 Tomorrow';
  } else if (diffDays === -1) {
    dateText = isCompleted ? '📅 Yesterday' : '⚠️ Yesterday (Overdue)';
  } else if (diffDays < -1) {
    const absDays = Math.abs(diffDays);
    dateText = isCompleted 
      ? `📅 ${dueDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}`
      : `⚠️ Overdue (${absDays}d ago)`;
  } else {
    dateText = `📅 ${dueDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
  }
  
  return { text: dateText, isOverdue: isOverdue };
}

// Master Render Method
function renderTasks(tasks) {
  const sortedTasks = [...tasks];
  sortTasks(sortedTasks);
  
  if (activeView === 'list') {
    renderListView(sortedTasks);
  } else {
    renderKanbanView(sortedTasks);
  }
}

// Render Tasks List (List View)
function renderListView(tasks) {
  tasksContainer.innerHTML = '';
  
  if (tasks.length === 0) {
    emptyState.classList.remove('hidden');
    tasksContainer.classList.add('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  tasksContainer.classList.remove('hidden');

  tasks.forEach(task => {
    const taskCard = document.createElement('div');
    taskCard.id = `task_${task.id}`;
    taskCard.className = `task-card ${task.completed ? 'completed' : ''}`;
    
    // Check if task is overdue
    let dueDateHTML = '';
    if (task.due_date) {
      const dateInfo = formatFriendlyDueDate(task.due_date, task.completed);
      dueDateHTML = `
        <span class="meta-item due-date ${dateInfo.isOverdue ? 'overdue' : ''}">
          ${dateInfo.text}
          ${dateInfo.isOverdue ? '<span class="overdue-tag">Overdue</span>' : ''}
        </span>
      `;
    }

    taskCard.innerHTML = `
      <div class="task-card-left">
        <button class="checkbox-button toggle-task-btn" data-id="${task.id}">
          <div class="custom-checkbox ${task.completed ? 'checked' : ''}">
            ${task.completed ? `
              <svg viewBox="0 0 24 24" class="check-icon">
                <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            ` : ''}
          </div>
        </button>
      </div>

      <div class="task-card-middle">
        <h3 class="task-title">
          <span class="priority-indicator-dot ${task.priority ? task.priority.toLowerCase() : 'medium'}"></span>
          ${escapeHTML(task.title)}
        </h3>
        ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
        <div class="task-meta">
          ${dueDateHTML}
          <span class="meta-item category-tag">🏷️ ${escapeHTML(task.category || 'General')}</span>
        </div>
      </div>

      <div class="task-card-right">
        <span class="priority-badge ${(task.priority || 'medium').toLowerCase()}">
          ${task.priority || 'Medium'}
        </span>
        
        <div class="task-actions">
          <button class="action-btn edit-btn edit-task-btn" data-id="${task.id}" title="Edit Task">✏️</button>
          <button class="action-btn delete-btn delete-task-btn" data-id="${task.id}" title="Delete Task">🗑️</button>
        </div>
      </div>
    `;

    // Attach listeners
    taskCard.querySelector('.toggle-task-btn').addEventListener('click', () => handleToggleTask(task.id));
    taskCard.querySelector('.edit-task-btn').addEventListener('click', () => showEditModal(task));
    taskCard.querySelector('.delete-task-btn').addEventListener('click', () => handleDeleteTask(task.id));

    tasksContainer.appendChild(taskCard);
  });
}

// Render Tasks in Kanban columns
function renderKanbanView(tasks) {
  const todoCol = document.getElementById('tasks-todo');
  const progressCol = document.getElementById('tasks-in_progress');
  const completedCol = document.getElementById('tasks-completed');

  // Reset columns
  todoCol.innerHTML = '';
  progressCol.innerHTML = '';
  completedCol.innerHTML = '';

  let todoCount = 0;
  let progressCount = 0;
  let completedCount = 0;

  tasks.forEach(task => {
    const card = document.createElement('div');
    card.id = `kanban_task_${task.id}`;
    card.className = `task-card glass-card ${task.completed ? 'completed' : ''}`;
    card.setAttribute('draggable', 'true');

    // Drag events
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', task.id);
      card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
    });

    let dueDateHTML = '';
    if (task.due_date) {
      const dateInfo = formatFriendlyDueDate(task.due_date, task.completed);
      dueDateHTML = `
        <span class="meta-item due-date ${dateInfo.isOverdue ? 'overdue' : ''}">
          ${dateInfo.text}
        </span>
      `;
    }

    card.innerHTML = `
      <div class="task-card-middle">
        <h3 class="task-title">
          <span class="priority-indicator-dot ${task.priority ? task.priority.toLowerCase() : 'medium'}"></span>
          ${escapeHTML(task.title)}
        </h3>
        ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
        <div class="task-meta">
          ${dueDateHTML}
          <span class="meta-item category-tag">🏷️ ${escapeHTML(task.category || 'General')}</span>
        </div>
      </div>

      <div class="task-card-right" style="margin-top: 0.75rem; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; border-top: 1px solid var(--border-glass); padding-top: 0.5rem;">
        <span class="priority-badge ${(task.priority || 'medium').toLowerCase()}" style="margin: 0;">
          ${task.priority || 'Medium'}
        </span>
        <div class="task-actions" style="margin: 0;">
          <button class="action-btn edit-btn edit-task-btn" data-id="${task.id}" title="Edit Task" style="font-size: 0.85rem; padding: 0.25rem;">✏️</button>
          <button class="action-btn delete-btn delete-task-btn" data-id="${task.id}" title="Delete Task" style="font-size: 0.85rem; padding: 0.25rem;">🗑️</button>
        </div>
      </div>
    `;

    card.querySelector('.edit-task-btn').addEventListener('click', () => showEditModal(task));
    card.querySelector('.delete-task-btn').addEventListener('click', () => handleDeleteTask(task.id));

    // Append to corresponding column
    const status = task.status || 'todo';
    if (status === 'todo') {
      todoCol.appendChild(card);
      todoCount++;
    } else if (status === 'in_progress') {
      progressCol.appendChild(card);
      progressCount++;
    } else {
      completedCol.appendChild(card);
      completedCount++;
    }
  });

  // Update headers count
  document.getElementById('count-todo').innerText = todoCount;
  document.getElementById('count-in_progress').innerText = progressCount;
  document.getElementById('count-completed').innerText = completedCount;
}

// Drag and drop setup for Kanban columns
function setupKanbanDragDrop() {
  const columns = document.querySelectorAll('.kanban-column-tasks');
  
  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.parentElement.classList.add('drag-over');
    });

    col.addEventListener('dragleave', () => {
      col.parentElement.classList.remove('drag-over');
    });

    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.parentElement.classList.remove('drag-over');
      
      const taskId = e.dataTransfer.getData('text/plain');
      const targetStatus = col.parentElement.dataset.status;
      
      if (taskId && targetStatus) {
        // Optimistic UI updates
        const taskObj = tasksState.find(t => t.id == taskId);
        if (taskObj && taskObj.status !== targetStatus) {
          taskObj.status = targetStatus;
          taskObj.completed = (targetStatus === 'completed');
          renderTasks(tasksState);
          await updateTaskStatusOnBackend(taskId, targetStatus);
        }
      }
    });
  });
}

// Update status endpoint
async function updateTaskStatusOnBackend(taskId, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ task: { status } })
    });
    if (!response.ok) throw new Error('Failed to update status');
    
    showToast(`Task moved to ${status.replace('_', ' ')}`);
    fetchMetrics(); // Update dashboard stats in background
  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
    loadData(); // Revert state if failed
  }
}

// Render Metrics to DOM
function renderMetrics(metrics) {
  const isOverdueClass = metrics.overdue > 0 ? 'text-high alert-border' : '';
  
  metricsContainer.innerHTML = `
    <div class="metric-card glass">
      <div class="metric-header">
        <span class="metric-value">${metrics.progress}%</span>
        <span class="metric-icon">📈</span>
      </div>
      <div class="metric-label">Progress</div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${metrics.progress}%"></div>
      </div>
    </div>

    <div class="metric-card glass">
      <div class="metric-header">
        <span class="metric-value">${metrics.pending}</span>
        <span class="metric-icon">⏳</span>
      </div>
      <div class="metric-label">Pending Tasks</div>
    </div>

    <div class="metric-card glass">
      <div class="metric-header">
        <span class="metric-value">${metrics.completed}</span>
        <span class="metric-icon">✅</span>
      </div>
      <div class="metric-label">Completed Tasks</div>
    </div>

    <div class="metric-card glass ${isOverdueClass}">
      <div class="metric-header">
        <span class="metric-value ${metrics.overdue > 0 ? 'text-high' : ''}">${metrics.overdue}</span>
        <span class="metric-icon">🚨</span>
      </div>
      <div class="metric-label">Overdue Tasks</div>
    </div>
  `;
}

// Handle Quick Add Submit
async function handleQuickAddSubmit(e) {
  e.preventDefault();
  if (!token) return;
  
  const title = document.getElementById('task-title-input').value.trim();
  const prioritySelect = document.getElementById('task-priority-input');
  const categorySelect = document.getElementById('task-category-input');
  const dueDate = document.getElementById('task-due-date-input').value;

  if (!title) return;

  const priority = prioritySelect.value || 'Medium';
  const category = categorySelect.value || 'General';

  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        task: { title, priority, category, due_date: dueDate || null, status: 'todo' }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.errors ? errData.errors.join(', ') : 'Failed to add task');
    }

    // Reset Form
    quickAddForm.reset();
    showToast('Task added successfully!');
    loadData();
  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
  }
}

// Handle Task Toggle completed state (List View only)
async function handleToggleTask(taskId) {
  if (!token) return;
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/toggle`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to toggle task');
    
    showToast('Task status updated!');
    loadData();
  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
  }
}

// Handle Task Delete
async function handleDeleteTask(taskId) {
  if (!token) return;
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to delete task');
    
    showToast('Task deleted successfully!');
    loadData();
  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
  }
}

// Show/Populate Edit Modal
function showEditModal(task) {
  editTaskIdInput.value = task.id;
  editTitleInput.value = task.title;
  editDescInput.value = task.description || '';
  editPriorityInput.value = task.priority || 'Medium';
  editCategoryInput.value = task.category || 'General';
  editDueDateInput.value = task.due_date || '';
  editCompletedInput.checked = task.completed;
  
  editModal.classList.remove('hidden');
}

function hideEditModal() {
  editModal.classList.add('hidden');
  editTaskForm.reset();
}

// Handle Edit Submit
async function handleEditSubmit(e) {
  e.preventDefault();
  if (!token) return;
  
  const id = editTaskIdInput.value;
  const title = editTitleInput.value.trim();
  const description = editDescInput.value.trim();
  const priority = editPriorityInput.value;
  const category = editCategoryInput.value;
  const dueDate = editDueDateInput.value;
  const completed = editCompletedInput.checked;

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        task: {
          title,
          description: description || null,
          priority,
          category,
          due_date: dueDate || null,
          completed
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.errors ? errData.errors.join(', ') : 'Failed to update task');
    }

    hideEditModal();
    showToast('Task updated successfully!');
    loadData();
  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
  }
}

// Filters and search logic
function handleSearch() {
  activeFilters.search = searchInput.value.trim();
  updateFilterUI();
  fetchTasks();
}

function handleFilterChange() {
  activeFilters.priority = filterPriority.value;
  activeFilters.category = filterCategory.value;
  updateFilterUI();
  fetchTasks();
}

function clearAllFilters() {
  activeFilters.search = '';
  activeFilters.status = '';
  activeFilters.priority = '';
  activeFilters.category = '';
  
  searchInput.value = '';
  filterPriority.value = '';
  filterCategory.value = '';
  
  statusFilterBtns.forEach(btn => btn.classList.remove('active'));
  statusFilterBtns[0].classList.add('active'); // Activate 'All'

  updateFilterUI();
  fetchTasks();
}

// Show/Hide Clear Filter indicator button
function updateFilterUI() {
  const hasActiveFilters = 
    activeFilters.search || 
    activeFilters.status || 
    activeFilters.priority || 
    activeFilters.category;

  if (hasActiveFilters) {
    clearFiltersBtn.classList.remove('hidden');
  } else {
    clearFiltersBtn.classList.add('hidden');
  }
}

// Toast alerts helper
function showToast(message, type = 'success') {
  toastAlert.innerText = message;
  toastAlert.classList.remove('hidden', 'alert-success', 'alert-danger');
  
  if (type === 'error') {
    toastAlert.classList.add('alert-danger');
    toastAlert.style.background = 'rgba(239, 68, 68, 0.15)';
    toastAlert.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    toastAlert.style.color = '#fca5a5';
  } else {
    toastAlert.classList.add('alert-success');
    toastAlert.style.background = 'rgba(16, 185, 129, 0.15)';
    toastAlert.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    toastAlert.style.color = '#34d399';
  }
  
  setTimeout(() => {
    toastAlert.classList.add('hidden');
  }, 4000);
}

// Simple HTML escaping helper for security
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
