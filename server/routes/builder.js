const express = require('express');
const { Resume } = require('../database');
const { GoogleGenAI } = require('@google/genai');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Render HTML template for the resume
function renderResumeHTML(data, templateName) {
    // Generate basic clean ATS-friendly HTML
    const getBulletList = (items) => {
        if (!items || !items.length) return '';
        return '<ul>' + items.map(item => `<li>${item}</li>`).join('') + '</ul>';
    };

    const expHTML = data.experience ? data.experience.map(exp => `
        <div class="section-item">
            <div class="item-header">
                <strong>${exp.title} - ${exp.company}</strong>
                <span>${exp.startDate} to ${exp.endDate} | ${exp.location}</span>
            </div>
            ${getBulletList(exp.responsibilities)}
        </div>
    `).join('') : '';

    const eduHTML = data.education ? data.education.map(ed => `
        <div class="section-item">
            <div class="item-header">
                <strong>${ed.degree}</strong>
                <span>${ed.startYear} - ${ed.endYear} | ${ed.cgpa ? `CGPA: ${ed.cgpa}` : ''}</span>
            </div>
            <div>${ed.college}, ${ed.location}</div>
        </div>
    `).join('') : '';

    const projHTML = data.projects ? data.projects.map(proj => `
        <div class="section-item">
            <div class="item-header">
                <strong>${proj.name}</strong>
                <span>${proj.url ? `<a href="${proj.url}">${proj.url}</a>` : ''}</span>
            </div>
            <div class="tech">Technologies: ${proj.technologies}</div>
            <p>${proj.description}</p>
            ${getBulletList(proj.bullets)}
        </div>
    `).join('') : '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 40px; font-size: 11pt; }
            h1 { font-size: 24pt; margin: 0 0 10px 0; color: #111; text-align: center; }
            .contact-info { text-align: center; margin-bottom: 20px; font-size: 10pt; color: #555; }
            .contact-info a { color: #555; text-decoration: none; margin: 0 5px; }
            h2 { font-size: 14pt; color: #222; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 20px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
            .section-item { margin-bottom: 15px; }
            .item-header { display: flex; justify-content: space-between; align-items: baseline; }
            strong { color: #000; }
            ul { margin-top: 5px; margin-bottom: 0; padding-left: 20px; }
            li { margin-bottom: 3px; }
            .tech { font-style: italic; font-size: 10pt; color: #666; margin-bottom: 5px; }
            p { margin: 5px 0; }
        </style>
    </head>
    <body>
        <h1>${data.name || 'Your Name'}</h1>
        <div class="contact-info">
            ${data.email ? `<a href="mailto:${data.email}">${data.email}</a> | ` : ''}
            ${data.phone ? `<span>${data.phone}</span> | ` : ''}
            ${data.location ? `<span>${data.location}</span>` : ''}
            <br>
            ${data.linkedin ? `<a href="${data.linkedin}">LinkedIn</a> | ` : ''}
            ${data.github ? `<a href="${data.github}">GitHub</a> | ` : ''}
            ${data.portfolio ? `<a href="${data.portfolio}">Portfolio</a>` : ''}
        </div>

        ${data.summary ? `
        <h2>Professional Summary</h2>
        <p>${data.summary}</p>
        ` : ''}

        ${expHTML ? `
        <h2>Experience</h2>
        ${expHTML}
        ` : ''}

        ${eduHTML ? `
        <h2>Education</h2>
        ${eduHTML}
        ` : ''}

        ${projHTML ? `
        <h2>Projects</h2>
        ${projHTML}
        ` : ''}

        ${data.skills && data.skills.length > 0 ? `
        <h2>Skills</h2>
        <p>${data.skills.join(' • ')}</p>
        ` : ''}
    </body>
    </html>
    `;
    return html;
}

// Generate PDF via Puppeteer
async function generatePDF(htmlContent, outputFilename) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    const outputPath = path.join(uploadDir, outputFilename);

    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        await page.pdf({ path: outputPath, format: 'A4', printBackground: true, margin: { top: '0', bottom: '0', left: '0', right: '0' } });
        return outputPath;
    } catch (err) {
        console.error("PDF generation failed:", err);
        throw err;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Extract text for DB text index (simple strip tags)
function stripTags(html) {
    return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

router.post('/save', async (req, res) => {
    const { name, resumeData, template } = req.body;
    
    if (!name || !resumeData) {
        return res.status(400).json({ error: 'Name and resume data required' });
    }

    try {
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `${safeName}_Resume_${Date.now()}.pdf`;
        
        const html = renderResumeHTML(resumeData, template);
        const pdfPath = await generatePDF(html, filename);
        const extractedText = stripTags(html);

        const resume = new Resume({
            original_name: `${safeName}_Resume.pdf`,
            stored_name: filename,
            file_path: pdfPath,
            extracted_text: extractedText,
            resume_data: JSON.stringify(resumeData),
            template: template || 'classic',
            is_created: true
        });
        await resume.save();

        res.status(201).json({
            message: 'Resume saved and PDF generated successfully',
            resumeId: resume._id
        });

    } catch (err) {
        console.error("Save builder error:", err);
        res.status(500).json({ error: 'Failed to save resume' });
    }
});

router.post('/improve', async (req, res) => {
    const { text, type } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    let prompt = `Improve the following resume ${type} text. Make it more professional, concise, and ATS friendly. Do NOT invent new facts. Return ONLY the improved text directly without conversational filler or markdown formatting.\n\nOriginal Text:\n${text}`;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { maxOutputTokens: 1024 }
        });
        const improvedText = response.text ? response.text.trim() : text;
        res.json({ result: improvedText });
    } catch (err) {
        console.error("Gemini assistance failed", {
            error: err,
            message: err instanceof Error ? err.message : String(err)
        });
        
        let frontendErrorMsg = "AI assistance failed";
        if (err.message && err.message.includes('429')) {
            frontendErrorMsg = "Gemini API Quota Exceeded. Please wait and try again later.";
        } else if (err.message && err.message.includes('404')) {
            frontendErrorMsg = "Gemini model is currently unavailable.";
        }
        
        return res.status(500).json({
            success: false,
            message: "AI assistance failed",
            error: frontendErrorMsg,
            code: "GEMINI_ERROR"
        });
    }
});

module.exports = router;
