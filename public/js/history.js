document.addEventListener('DOMContentLoaded', async () => {
    renderSidebar('history');
    loadHistory();
});

async function loadHistory() {
    const grid = document.getElementById('historyGrid');
    try {
        const history = await apiRequest('/api/analysis/history/all');
        
        if (history.length === 0) {
            grid.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <h3>No analysis history</h3>
                    <p class="text-muted mb-4">You haven't analyzed any resumes yet.</p>
                    <a href="/analyze.html" class="btn btn-primary">Analyze a Resume</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = history.map(item => `
            <div class="card resume-card">
                <h3>${item.resume_name}</h3>
                
                <div class="mb-4" style="font-size: 0.875rem;">
                    <div class="text-muted">Date: ${formatDate(item.created_at)}</div>
                    ${item.target_role ? `<div class="text-muted">Target: <b>${item.target_role}</b></div>` : ''}
                </div>
                
                <div class="mb-4">
                    <span class="score-badge ${getScoreClass(item.ats_score)}">
                        Score: ${item.ats_score}
                    </span>
                </div>
                
                <div class="resume-card-actions">
                    <button class="btn btn-primary" onclick="viewReport(${item.id})" style="flex:1;">View Report</button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Failed to load history:', err);
        grid.innerHTML = '<p class="text-muted" style="color: var(--error-color)">Failed to load history.</p>';
    }
}

function viewReport(analysisId) {
    window.location.href = `/report.html?analysisId=${analysisId}`;
}
