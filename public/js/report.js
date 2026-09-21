let currentAnalysisId = null;
let currentResumeName = '';

document.addEventListener('DOMContentLoaded', async () => {
    // Sidebar might not be needed when printing, but good for normal view
    renderSidebar('');

    const urlParams = new URLSearchParams(window.location.search);
    const analysisId = urlParams.get('analysisId');
    const resumeId = urlParams.get('resumeId');

    if (analysisId) {
        loadReport(`/api/analysis/${analysisId}`);
    } else if (resumeId) {
        loadReport(`/api/analysis/resume/${resumeId}`);
    } else {
        document.getElementById('reportContent').innerHTML = `
            <div class="card" style="text-align: center;">
                <h3>No Report Specified</h3>
                <a href="/history.html" class="btn btn-primary mt-4">Go to History</a>
            </div>
        `;
    }
});

async function loadReport(url) {
    const container = document.getElementById('reportContent');
    try {
        const analysis = await apiRequest(url);
        currentAnalysisId = analysis.id;

        // Fetch resume name if needed, but we don't have it in the analysis object currently,
        // it just has resume_id. We'll skip complex joins for simplicity, or fetch the resume.
        let resumeName = 'Resume Analysis';
        try {
            const res = await apiRequest(`/api/resumes/${analysis.resume_id}`);
            resumeName = res.original_name;
            document.title = `${resumeName} - ATS Report`;
        } catch (e) {
            console.error('Could not fetch resume name');
        }
        currentResumeName = resumeName;

        let html = `
            <div class="card">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <h2>${resumeName}</h2>
                    <p class="text-muted">Analyzed on ${formatDate(analysis.created_at)}</p>
                </div>

                <div class="grid-2 mb-4">
                    <div class="card" style="text-align: center; border: 2px solid var(--brand-cta);">
                        <h3 class="text-muted">General ATS Score</h3>
                        <div class="stat-value ${getScoreClass(analysis.ats_score)}">${analysis.ats_score} / 100</div>
                    </div>
                    ${analysis.target_role ? `
                    <div class="card" style="text-align: center; border: 2px solid var(--success-color);">
                        <h3 class="text-muted">Job Match Score</h3>
                        <div class="stat-value ${getScoreClass(analysis.job_match_score)}">${analysis.job_match_score} / 100</div>
                        <p style="margin-top:0.5rem; font-weight:bold;">${analysis.target_role}</p>
                    </div>
                    ` : ''}
                </div>

                <div class="report-section">
                    <h3>Summary</h3>
                    <p>${analysis.summary}</p>
                </div>

                <div class="report-section">
                    <h3>Strengths</h3>
                    <ul class="list-items positive">
                        ${renderList(analysis.strengths)}
                    </ul>
                </div>

                <div class="report-section">
                    <h3>Weaknesses</h3>
                    <ul class="list-items negative">
                        ${renderList(analysis.weaknesses)}
                    </ul>
                </div>

                ${analysis.missing_skills && analysis.missing_skills.length > 0 ? `
                <div class="report-section">
                    <h3>Missing Skills (for Target Role)</h3>
                    <ul class="list-items negative">
                        ${renderList(analysis.missing_skills)}
                    </ul>
                </div>
                ` : ''}

                <div class="report-section">
                    <h3>Actionable Suggestions</h3>
                    <ul class="list-items neutral">
                        ${renderList(analysis.suggestions)}
                    </ul>
                </div>

                <div class="report-section">
                    <h3>ATS Optimization Tips</h3>
                    <ul class="list-items neutral">
                        ${renderList(analysis.ats_tips)}
                    </ul>
                </div>

                <div class="report-section" style="background-color: var(--bg-color); padding: 1.5rem; border-radius: 0.5rem;">
                    <h3>Overall Recommendation</h3>
                    <p style="font-weight: 500;">${analysis.recommendation}</p>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `
            <div class="card text-center" style="color: var(--error-color);">
                <h3>Error Loading Report</h3>
                <p>${err.message}</p>
            </div>
        `;
    }
}

function renderList(items) {
    if (!items || !Array.isArray(items) || items.length === 0) return '<li>None provided</li>';
    return items.map(i => `<li>${i}</li>`).join('');
}

function openEmailModal() {
    const modal = document.getElementById('emailModal');
    if (modal) {
        modal.style.display = 'flex';
        
        const reportNameEl = document.getElementById('emailReportName');
        if (reportNameEl) {
            reportNameEl.textContent = `Report: ${currentResumeName || 'Loading...'}`;
        }
        
        const emailInput = document.getElementById('emailInput');
        if (emailInput && !emailInput.value) {
            const savedEmail = localStorage.getItem('userEmail');
            if (savedEmail) {
                emailInput.value = savedEmail;
            }
        }
        const msgDiv = document.getElementById('emailMessage');
        msgDiv.textContent = '';
        msgDiv.style.color = 'inherit';
    }
}

function closeEmailModal() {
    const modal = document.getElementById('emailModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function sendEmailReport() {
    const emailInput = document.getElementById('emailInput');
    const msgDiv = document.getElementById('emailMessage');
    const btn = document.getElementById('emailSendBtn');
    const email = emailInput.value.trim();

    if (!email) {
        msgDiv.textContent = 'Please enter an email address.';
        msgDiv.style.color = 'var(--error-color)';
        return;
    }

    if (!currentAnalysisId) {
        msgDiv.textContent = 'Analysis not fully loaded yet.';
        msgDiv.style.color = 'var(--error-color)';
        return;
    }

    localStorage.setItem('userEmail', email);

    try {
        btn.disabled = true;
        btn.textContent = 'Sending...';
        msgDiv.textContent = 'Sending report...';
        msgDiv.style.color = 'var(--brand-cta)';

        const response = await fetch(`/api/email/${currentAnalysisId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            msgDiv.textContent = '✓ Report sent successfully!';
            msgDiv.style.color = 'var(--success-color)';
            setTimeout(() => {
                closeEmailModal();
            }, 2000);
        } else {
            msgDiv.textContent = data.message || 'Error sending report.';
            msgDiv.style.color = 'var(--error-color)';
        }
    } catch (err) {
        msgDiv.textContent = 'Failed to connect to server.';
        msgDiv.style.color = 'var(--error-color)';
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Report';
    }
}
