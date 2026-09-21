let currentRenameId = null;

document.addEventListener('DOMContentLoaded', async () => {
    renderSidebar('resumes');
    loadResumes();
});

async function loadResumes() {
    const grid = document.getElementById('resumesGrid');
    try {
        const resumes = await apiRequest('/api/resumes');
        
        if (resumes.length === 0) {
            grid.innerHTML = `
                <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <h3>No resumes found</h3>
                    <p class="text-muted mb-4">You haven't uploaded any resumes yet.</p>
                    <a href="/analyze.html" class="btn btn-primary">Upload Resume</a>
                </div>
            `;
            return;
        }

        grid.innerHTML = resumes.map(r => `
            <div class="card resume-card">
                <h3>${r.original_name}</h3>
                
                <div class="mb-4" style="font-size: 0.875rem;">
                    <span class="score-badge" style="background-color: var(--brand-light); color: var(--brand-dark); margin-bottom: 0.5rem; font-size: 0.75rem;">
                        ${r.is_created ? 'Created Resume' : 'Uploaded Resume'}
                    </span>
                    <div class="text-muted">Date: ${formatDate(r.uploaded_at)}</div>
                    <div class="text-muted">Analyzed: ${r.last_analyzed_at ? formatDate(r.last_analyzed_at) : 'Never'}</div>
                </div>
                
                <div class="mb-4">
                    <span class="score-badge ${getScoreClass(r.ats_score)}">
                        ATS Score: ${r.ats_score !== null ? r.ats_score : 'N/A'}
                    </span>
                </div>
                
                <div class="resume-card-actions">
                    ${r.ats_score !== null 
                        ? `<button class="btn btn-outline" onclick="viewReport(${r.id})" style="flex:1; padding: 0.25rem;">Report</button>`
                        : ''
                    }
                    <button class="btn btn-primary" onclick="analyzeResume(${r.id})" style="flex:1; padding: 0.25rem;">Analyze</button>
                    <a href="/uploads/${r.stored_name}" download="${r.original_name}" target="_blank" class="btn btn-outline" style="flex:1; padding: 0.25rem;">Download</a>
                    <button class="btn btn-outline" onclick="openRenameModal(${r.id}, '${r.original_name.replace(/'/g, "\\'")}')" style="flex:1; padding: 0.25rem;">Rename</button>
                    <button class="btn btn-danger" onclick="deleteResume(${r.id})" style="flex:1; padding: 0.25rem;">Delete</button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Failed to load resumes:', err);
        grid.innerHTML = '<p class="text-muted" style="color: var(--error-color)">Failed to load resumes.</p>';
    }
}

function analyzeResume(id) {
    // We navigate to analyze page with the ID so user can provide JD if they want
    window.location.href = `/analyze.html?resumeId=${id}`;
}

function viewReport(id) {
    window.location.href = `/report.html?resumeId=${id}`;
}

async function deleteResume(id) {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    
    try {
        await apiRequest(`/api/resumes/${id}`, { method: 'DELETE' });
        loadResumes();
    } catch (err) {
        alert('Failed to delete resume: ' + err.message);
    }
}

function openRenameModal(id, currentName) {
    currentRenameId = id;
    document.getElementById('renameInput').value = currentName;
    document.getElementById('renameModal').style.display = 'flex';
}

function closeRenameModal() {
    currentRenameId = null;
    document.getElementById('renameModal').style.display = 'none';
}

async function submitRename() {
    if (!currentRenameId) return;
    const newName = document.getElementById('renameInput').value.trim();
    if (!newName) return;

    try {
        await apiRequest(`/api/resumes/${currentRenameId}`, {
            method: 'PUT',
            body: JSON.stringify({ original_name: newName })
        });
        closeRenameModal();
        loadResumes();
    } catch (err) {
        alert('Failed to rename: ' + err.message);
    }
}
