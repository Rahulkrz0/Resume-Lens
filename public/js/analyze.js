let uploadedResumeId = null;

document.addEventListener('DOMContentLoaded', async () => {
    renderSidebar('analyze');
    await loadResumesDropdown();

    // If navigated from resumes page with ID
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get('resumeId');
    if (resumeId) {
        document.getElementById('resumeSelect').value = resumeId;
    }
});

function toggleSource() {
    const source = document.querySelector('input[name="resumeSource"]:checked').value;
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (source === 'existing') {
        document.getElementById('existingSource').style.display = 'block';
        document.getElementById('uploadSource').style.display = 'none';
        analyzeBtn.disabled = false;
    } else {
        document.getElementById('existingSource').style.display = 'none';
        document.getElementById('uploadSource').style.display = 'block';
        analyzeBtn.disabled = !uploadedResumeId;
    }
}

async function handleAutoUpload() {
    const fileInput = document.getElementById('resumeFile');
    const successDiv = document.getElementById('uploadSuccess');
    const statusDiv = document.getElementById('uploadStatus');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (!fileInput.files.length) return;
    
    hideError('uploadError');
    successDiv.style.display = 'none';
    statusDiv.textContent = 'Uploading Resume...';
    statusDiv.style.display = 'block';
    analyzeBtn.disabled = true;
    uploadedResumeId = null;
    
    try {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        const res = await fetch(API_BASE_URL + '/api/resumes/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (!res.ok) {
            let errMsg = data.message || data.error || 'Upload failed';
            if (data.code === 'PDF_PARSE_ERROR') {
                errMsg = 'We couldn\'t read this PDF. Please upload a valid text-based PDF.';
            } else if (data.code === 'NO_TEXT_EXTRACTED') {
                errMsg = 'Your PDF does not contain selectable text. Please upload a text-based PDF.';
            } else if (data.code === 'EMPTY_PDF') {
                errMsg = 'Uploaded PDF is empty or could not be read.';
            } else if (data.code === 'PDF_UPLOAD_ERROR') {
                errMsg = 'There was a problem uploading your file. Please try again.';
            }
            throw new Error(errMsg);
        }
        
        uploadedResumeId = data.resume ? data.resume.id : data.resumeId;
        statusDiv.style.display = 'none';
        successDiv.textContent = '✓ Resume uploaded successfully';
        successDiv.style.display = 'block';
        
        // Refresh dropdown in background just to keep it updated
        loadResumesDropdown();
        
        analyzeBtn.disabled = false;
    } catch (err) {
        statusDiv.style.display = 'none';
        showError('uploadError', err.message);
        analyzeBtn.disabled = true;
    }
}

async function loadResumesDropdown() {
    const select = document.getElementById('resumeSelect');
    try {
        const resumes = await apiRequest('/api/resumes');
        if (resumes.length === 0) {
            select.innerHTML = '<option value="">No resumes found. Please upload one.</option>';
            document.querySelector('input[name="resumeSource"][value="upload"]').checked = true;
            toggleSource();
        } else {
            select.innerHTML = resumes.map(r => `<option value="${r.id}">${r.original_name}</option>`).join('');
        }
    } catch (err) {
        select.innerHTML = '<option value="">Failed to load resumes</option>';
    }
}

async function handleAnalyze(e) {
    e.preventDefault();
    hideError('analyzeError');
    hideError('uploadError');

    const source = document.querySelector('input[name="resumeSource"]:checked').value;
    const targetRole = document.getElementById('targetRole').value.trim();
    const jobDescription = document.getElementById('jobDescription').value.trim();
    
    let resumeId = null;

    const btn = document.getElementById('analyzeBtn');
    btn.disabled = true;

    try {
        if (source === 'upload') {
            if (!uploadedResumeId) {
                showError('analyzeError', 'Please upload a resume first.');
                btn.disabled = false;
                return;
            }
            resumeId = uploadedResumeId;
        } else {
            resumeId = document.getElementById('resumeSelect').value;
            if (!resumeId) {
                showError('analyzeError', 'Please select a resume');
                btn.disabled = false;
                return;
            }
        }

        showLoading('Analyzing Resume with AI (This may take 10-20 seconds)...');

        const analysisRes = await apiRequest('/api/analysis/analyze', {
            method: 'POST',
            body: JSON.stringify({ resumeId, targetRole, jobDescription })
        });

        // Redirect to report
        window.location.href = `/report.html?analysisId=${analysisRes.id}`;

    } catch (err) {
        hideLoading();
        if (err.isUploadError) {
            showError('uploadError', err.message);
        } else {
            showError('analyzeError', err.message);
        }
        btn.disabled = false;
    }
}
