// TaskFlow Frontend SPA JavaScript client
// When deploying to production (e.g. Vercel), window.API_BASE_URL can be injected or set below
const API_BASE_URL = window.API_BASE_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://to-do-list-3rmi.onrender.com'
);

// App state
let tasksState = [];
let activeFilters = {
  search: '',
  status: '',
  priority: '',
  category: ''
};

// DOM Elements
const tasksContainer = document.getElementById('tasks-container');
const emptyState = document.getElementById('empty-state');
const metricsContainer = document.getElementById('dashboard-metrics');
const quickAddForm = document.getElementById('quick-add-form');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const filterPriority = document.getElementById('filter-priority');
const filterCategory = document.getElementById('filter-category');
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

  // Load initial data
  loadData();

  // Attach Event Listeners
  quickAddForm.addEventListener('submit', handleQuickAddSubmit);
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
  clearFiltersBtn.addEventListener('click', clearAllFilters);
  filterPriority.addEventListener('change', handleFilterChange);
  filterCategory.addEventListener('change', handleFilterChange);
  
  statusFilterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      statusFilterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeFilters.status = e.target.dataset.status;
      updateFilterUI();
      loadData();
    });
  });

  // Modal events
  closeModelBtn.addEventListener('click', hideEditModal);
  window.addEventListener('click', (e) => { if (e.target === editModal) hideEditModal(); });
  editTaskForm.addEventListener('submit', handleEditSubmit);
});

// Load all dashboard data (tasks + metrics)
async function loadData() {
  await Promise.all([
    fetchTasks(),
    fetchMetrics()
  ]);
}

// Fetch tasks with filters applied
async function fetchTasks() {
  try {
    const queryParams = new URLSearchParams();
    if (activeFilters.search) queryParams.append('search', activeFilters.search);
    if (activeFilters.status) queryParams.append('status', activeFilters.status);
    if (activeFilters.priority) queryParams.append('priority', activeFilters.priority);
    if (activeFilters.category) queryParams.append('category', activeFilters.category);

    const response = await fetch(`${API_BASE_URL}/tasks?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    
    tasksState = await response.json();
    renderTasks(tasksState);
  } catch (error) {
    console.error(error);
    showToast('Failed to connect to backend server. Make sure it is running on port 3000.', 'error');
  }
}

// Fetch metrics summary
async function fetchMetrics() {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/metrics`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    
    const metrics = await response.json();
    renderMetrics(metrics);
  } catch (error) {
    console.error(error);
  }
}

// Render Tasks List to DOM
function renderTasks(tasks) {
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
      const isOverdue = new Date(task.due_date) < new Date().setHours(0,0,0,0) && !task.completed;
      const formattedDate = new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      dueDateHTML = `
        <span class="meta-item due-date ${isOverdue ? 'overdue' : ''}">
          📅 ${formattedDate}
          ${isOverdue ? '<span class="overdue-tag">Overdue</span>' : ''}
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
        <h3 class="task-title">${escapeHTML(task.title)}</h3>
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

    // Attach local dynamic listeners inside card
    taskCard.querySelector('.toggle-task-btn').addEventListener('click', () => handleToggleTask(task.id));
    taskCard.querySelector('.edit-task-btn').addEventListener('click', () => showEditModal(task));
    taskCard.querySelector('.delete-task-btn').addEventListener('click', () => handleDeleteTask(task.id));

    tasksContainer.appendChild(taskCard);
  });
}

// Render Metrics to DOM
function renderMetrics(metrics) {
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

    <div class="metric-card glass alert-border">
      <div class="metric-header">
        <span class="metric-value text-high">${metrics.high_pending}</span>
        <span class="metric-icon">🔥</span>
      </div>
      <div class="metric-label">High Priority</div>
    </div>
  `;
}

// Handle Quick Add Submit
async function handleQuickAddSubmit(e) {
  e.preventDefault();
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: { title, priority, category, due_date: dueDate || null }
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

// Handle Task Toggle completed state
async function handleToggleTask(taskId) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
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
  if (!confirm('Are you sure you want to delete this task?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE'
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
      headers: { 'Content-Type': 'application/json' },
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
