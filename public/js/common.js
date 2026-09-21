// Common utility functions

// API Fetch wrapper
const API_BASE_URL = 'https://resume-lens-ogky.onrender.com';

async function apiRequest(url, options = {}) {
    const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || `HTTP error ${response.status}`);
        }

        return data;
    } catch (err) {
        throw err;
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Show error
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
    } else {
        alert(message);
    }
}

function hideError(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.style.display = 'none';
}

// Loading states
function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('global-loading');
    if (overlay) {
        overlay.querySelector('p').textContent = message;
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('global-loading');
    if (overlay) overlay.style.display = 'none';
}

// Common HTML snippets injection
function renderSidebar(activePage) {
    const isDark = document.documentElement.classList.contains('dark-mode') || 
                   (!document.documentElement.classList.contains('light-mode') && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const sidebarHTML = `
        <div class="sidebar-logo d-flex align-center gap-2" id="sidebarToggle" style="margin-bottom: 2.5rem; padding: 0 1rem; cursor: pointer; user-select: none;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#logoGrad)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="logo-icon">
                <defs>
                    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#8B5CF6" />
                        <stop offset="100%" stop-color="#14B8A6" />
                    </linearGradient>
                </defs>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span class="logo-text">Resume Lens</span>
        </div>
        <nav>
            <a href="/dashboard.html" title="Dashboard" class="nav-link d-flex align-center gap-2 ${activePage === 'dashboard' ? 'active' : ''}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span class="nav-text">Dashboard</span>
            </a>
            <a href="/resumes.html" title="My Resumes" class="nav-link d-flex align-center gap-2 ${activePage === 'resumes' ? 'active' : ''}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span class="nav-text">My Resumes</span>
            </a>
            <a href="/builder.html" title="Create Resume" class="nav-link d-flex align-center gap-2 ${activePage === 'builder' ? 'active' : ''}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                <span class="nav-text">Create Resume</span>
            </a>
            <a href="/analyze.html" title="Analyze Resume" class="nav-link d-flex align-center gap-2 ${activePage === 'analyze' ? 'active' : ''}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <span class="nav-text">Analyze Resume</span>
            </a>
            <a href="/history.html" title="History" class="nav-link d-flex align-center gap-2 ${activePage === 'history' ? 'active' : ''}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span class="nav-text">History</span>
            </a>
        </nav>
    `;
    
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.innerHTML = sidebarHTML;
        
        // Setup collapsible sidebar functionality
        const sidebarToggle = document.getElementById('sidebarToggle');
        
        // Check local storage for initial state
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            });
        }
    }
}

function getScoreClass(score) {
    if (!score && score !== 0) return '';
    if (score >= 80) return 'score-good';
    if (score >= 60) return 'score-avg';
    return 'score-bad';
}
