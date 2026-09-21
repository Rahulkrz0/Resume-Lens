document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('userGreeting').textContent = `Welcome back!`;
    renderSidebar('dashboard');
    loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const data = await apiRequest('/api/dashboard/stats');
        
        document.getElementById('statTotal').textContent = data.totalResumes;
        document.getElementById('statAvg').textContent = data.averageScore;
        document.getElementById('statAnalyzed').textContent = data.analyzedResumes;

        const activityList = document.getElementById('recentActivityList');
        if (data.recentActivity && data.recentActivity.length > 0) {
            activityList.innerHTML = data.recentActivity.map(item => `
                <div style="padding: 1rem 0; border-bottom: 1px solid var(--border-color);">
                    <div style="font-weight: 500;">${item.activity_text}</div>
                    <div class="text-muted" style="font-size: 0.875rem; margin-top: 0.25rem;">${formatDate(item.date)}</div>
                </div>
            `).join('');
        } else {
            activityList.innerHTML = '<p class="text-muted">No recent activity found.</p>';
        }
    } catch (err) {
        console.error('Failed to load dashboard stats:', err);
        document.getElementById('recentActivityList').innerHTML = '<p class="text-muted" style="color: var(--error-color)">Failed to load data.</p>';
    }
}
