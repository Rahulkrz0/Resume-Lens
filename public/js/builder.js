let experienceCount = 0;
let educationCount = 0;
let projectCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Add "Create Resume" to sidebar injection via common.js first, we'll do it by updating renderSidebar in common.js later, but here we just pass the active state.
    renderSidebar('builder');
    
    // Add initial empty fields
    addExperience();
    addEducation();
    
    // Initial preview render
    updatePreview();
});

// --- Dynamic Fields ---

function addExperience() {
    const id = experienceCount++;
    const html = `
        <div class="dynamic-item" id="exp_${id}">
            <div class="grid-2">
                <div class="form-group"><label class="form-label">Job Title</label><input type="text" class="form-control exp-title" oninput="updatePreview()"></div>
                <div class="form-group"><label class="form-label">Company</label><input type="text" class="form-control exp-company" oninput="updatePreview()"></div>
                <div class="form-group"><label class="form-label">Start Date</label><input type="text" class="form-control exp-start" oninput="updatePreview()" placeholder="Jan 2020"></div>
                <div class="form-group"><label class="form-label">End Date</label><input type="text" class="form-control exp-end" oninput="updatePreview()" placeholder="Present"></div>
                <div class="form-group"><label class="form-label">Location</label><input type="text" class="form-control exp-location" oninput="updatePreview()"></div>
            </div>
            <div class="form-group">
                <label class="form-label">Responsibilities (one per line)</label>
                <textarea class="form-control exp-resp" rows="3" id="exp_resp_${id}" oninput="updatePreview()"></textarea>
                <button class="btn btn-outline ai-btn" onclick="improveText('exp_resp_${id}', 'bullet points')">✨ Improve with AI</button>
            </div>
            <button class="btn btn-danger ai-btn" onclick="document.getElementById('exp_${id}').remove(); updatePreview();">Remove</button>
        </div>
    `;
    document.getElementById('experienceList').insertAdjacentHTML('beforeend', html);
}

function addEducation() {
    const id = educationCount++;
    const html = `
        <div class="dynamic-item" id="edu_${id}">
            <div class="grid-2">
                <div class="form-group"><label class="form-label">Degree</label><input type="text" class="form-control edu-degree" oninput="updatePreview()"></div>
                <div class="form-group"><label class="form-label">College/University</label><input type="text" class="form-control edu-college" oninput="updatePreview()"></div>
                <div class="form-group"><label class="form-label">Location</label><input type="text" class="form-control edu-location" oninput="updatePreview()"></div>
                <div class="form-group"><label class="form-label">CGPA / Percentage</label><input type="text" class="form-control edu-cgpa" oninput="updatePreview()"></div>
                <div class="form-group"><label class="form-label">Start Year</label><input type="text" class="form-control edu-start" oninput="updatePreview()"></div>
                <div class="form-group"><label class="form-label">End Year</label><input type="text" class="form-control edu-end" oninput="updatePreview()"></div>
            </div>
            <button class="btn btn-danger ai-btn" onclick="document.getElementById('edu_${id}').remove(); updatePreview();">Remove</button>
        </div>
    `;
    document.getElementById('educationList').insertAdjacentHTML('beforeend', html);
}

function addProject() {
    const id = projectCount++;
    const html = `
        <div class="dynamic-item" id="proj_${id}">
            <div class="grid-2">
                <div class="form-group"><label class="form-label">Project Name</label><input type="text" class="form-control proj-name" oninput="updatePreview()"></div>
                <div class="form-group"><label class="form-label">Technologies</label><input type="text" class="form-control proj-tech" oninput="updatePreview()" placeholder="React, Node.js"></div>
                <div class="form-group"><label class="form-label">Project URL (Optional)</label><input type="text" class="form-control proj-url" oninput="updatePreview()"></div>
            </div>
            <div class="form-group">
                <label class="form-label">Description & Bullet points (one per line)</label>
                <textarea class="form-control proj-desc" rows="3" id="proj_desc_${id}" oninput="updatePreview()"></textarea>
                <button class="btn btn-outline ai-btn" onclick="improveText('proj_desc_${id}', 'project description')">✨ Improve with AI</button>
            </div>
            <button class="btn btn-danger ai-btn" onclick="document.getElementById('proj_${id}').remove(); updatePreview();">Remove</button>
        </div>
    `;
    document.getElementById('projectList').insertAdjacentHTML('beforeend', html);
}

// --- Data Extraction ---

function getFormData() {
    const data = {
        name: document.getElementById('p_name').value.trim(),
        email: document.getElementById('p_email').value.trim(),
        phone: document.getElementById('p_phone').value.trim(),
        location: document.getElementById('p_location').value.trim(),
        linkedin: document.getElementById('p_linkedin').value.trim(),
        github: document.getElementById('p_github').value.trim(),
        summary: document.getElementById('p_summary').value.trim(),
        skills: document.getElementById('p_skills').value.split(',').map(s => s.trim()).filter(s => s),
        experience: [],
        education: [],
        projects: []
    };

    document.querySelectorAll('#experienceList .dynamic-item').forEach(el => {
        data.experience.push({
            title: el.querySelector('.exp-title').value.trim(),
            company: el.querySelector('.exp-company').value.trim(),
            start: el.querySelector('.exp-start').value.trim(),
            end: el.querySelector('.exp-end').value.trim(),
            location: el.querySelector('.exp-location').value.trim(),
            resp: el.querySelector('.exp-resp').value.split('\n').map(s => s.trim()).filter(s => s)
        });
    });

    document.querySelectorAll('#educationList .dynamic-item').forEach(el => {
        data.education.push({
            degree: el.querySelector('.edu-degree').value.trim(),
            college: el.querySelector('.edu-college').value.trim(),
            location: el.querySelector('.edu-location').value.trim(),
            cgpa: el.querySelector('.edu-cgpa').value.trim(),
            start: el.querySelector('.edu-start').value.trim(),
            end: el.querySelector('.edu-end').value.trim()
        });
    });

    document.querySelectorAll('#projectList .dynamic-item').forEach(el => {
        data.projects.push({
            name: el.querySelector('.proj-name').value.trim(),
            tech: el.querySelector('.proj-tech').value.trim(),
            url: el.querySelector('.proj-url').value.trim(),
            desc: el.querySelector('.proj-desc').value.split('\n').map(s => s.trim()).filter(s => s)
        });
    });

    return data;
}

// --- Live Preview ---

function updatePreview() {
    const data = getFormData();
    const preview = document.getElementById('livePreview');

    const expHTML = data.experience.filter(e => e.title || e.company).map(exp => `
        <div class="preview-item">
            <div class="preview-item-header">
                <span>${exp.title} - ${exp.company}</span>
                <span style="font-weight:normal; color:#555;">${exp.start} - ${exp.end} | ${exp.location}</span>
            </div>
            <ul style="margin:5px 0 0 20px; padding:0;">
                ${exp.resp.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>
    `).join('');

    const eduHTML = data.education.filter(e => e.degree || e.college).map(ed => `
        <div class="preview-item">
            <div class="preview-item-header">
                <span>${ed.degree}</span>
                <span style="font-weight:normal; color:#555;">${ed.start} - ${ed.end}</span>
            </div>
            <div>${ed.college}, ${ed.location} ${ed.cgpa ? `| CGPA: ${ed.cgpa}` : ''}</div>
        </div>
    `).join('');

    const projHTML = data.projects.filter(p => p.name).map(proj => `
        <div class="preview-item">
            <div class="preview-item-header">
                <span>${proj.name}</span>
                <span style="font-weight:normal; color:#555;">${proj.url}</span>
            </div>
            <div style="font-style:italic; font-size: 0.9em; color:#666;">Technologies: ${proj.tech}</div>
            <ul style="margin:5px 0 0 20px; padding:0;">
                ${proj.desc.map(d => `<li>${d}</li>`).join('')}
            </ul>
        </div>
    `).join('');

    let html = `
        <div class="preview-header">
            <h1>${data.name || 'Your Name'}</h1>
            <div class="preview-contact">
                ${data.email ? `<span>${data.email}</span> | ` : ''}
                ${data.phone ? `<span>${data.phone}</span> | ` : ''}
                ${data.location ? `<span>${data.location}</span>` : ''}
                <br>
                ${data.linkedin ? `<span>LinkedIn</span> | ` : ''}
                ${data.github ? `<span>GitHub</span>` : ''}
            </div>
        </div>
    `;

    if (data.summary) {
        html += `<div class="preview-section"><h2>Summary</h2><p>${data.summary}</p></div>`;
    }
    if (expHTML) {
        html += `<div class="preview-section"><h2>Experience</h2>${expHTML}</div>`;
    }
    if (eduHTML) {
        html += `<div class="preview-section"><h2>Education</h2>${eduHTML}</div>`;
    }
    if (projHTML) {
        html += `<div class="preview-section"><h2>Projects</h2>${projHTML}</div>`;
    }
    if (data.skills.length > 0) {
        html += `<div class="preview-section"><h2>Skills</h2><p>${data.skills.join(' • ')}</p></div>`;
    }

    preview.innerHTML = html;
}

// --- AI Assistance ---

async function improveText(elementId, type) {
    const el = document.getElementById(elementId);
    const text = el.value.trim();
    if (!text) {
        alert("Please write some text first before improving it.");
        return;
    }
    
    showLoading(`Improving ${type} with AI...`);
    try {
        const res = await apiRequest('/api/builder/improve', {
            method: 'POST',
            body: JSON.stringify({ text, type })
        });
        
        if (confirm(`AI Suggestion:\n\n${res.result}\n\nReplace your current text?`)) {
            el.value = res.result;
            updatePreview();
        }
    } catch (err) {
        alert("Failed to improve text: " + err.message);
    } finally {
        hideLoading();
    }
}

// --- Saving ---

async function saveResume(download) {
    const data = getFormData();
    if (!data.name) {
        alert("Please enter at least your Full Name.");
        return;
    }

    showLoading('Saving and Generating PDF...');
    try {
        const payload = {
            name: data.name,
            resumeData: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                location: data.location,
                linkedin: data.linkedin,
                github: data.github,
                summary: data.summary,
                skills: data.skills,
                experience: data.experience.map(e => ({ title: e.title, company: e.company, startDate: e.start, endDate: e.end, location: e.location, responsibilities: e.resp })),
                education: data.education.map(e => ({ degree: e.degree, college: e.college, location: e.location, startYear: e.start, endYear: e.end, cgpa: e.cgpa })),
                projects: data.projects.map(p => ({ name: p.name, tech: p.tech, url: p.url, bullets: p.desc }))
            },
            template: 'classic'
        };

        const res = await apiRequest('/api/builder/save', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        alert("Resume saved successfully!");
        if (download) {
            window.location.href = `/resumes.html`;
            window.location.href = '/resumes.html';
        } else {
            window.location.href = '/resumes.html';
        }
    } catch (err) {
        alert("Failed to save resume: " + err.message);
    } finally {
        hideLoading();
    }
}
