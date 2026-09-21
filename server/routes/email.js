const express = require('express');
const { Analysis } = require('../database');
const { Resend } = require('resend');
const puppeteer = require('puppeteer');

const router = express.Router();

let resendClient = null;
if (process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
}

router.post('/:id', async (req, res) => {
    const { email } = req.body;
    const analysisId = req.params.id;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    if (!resendClient) {
        return res.status(500).json({ success: false, message: 'Resend API Key is not configured' });
    }

    try {
        let analysisDoc = await Analysis.findById(analysisId).populate('resume_id', 'original_name');
        
        if (!analysisDoc) {
            return res.status(404).json({ success: false, message: 'Analysis not found' });
        }

        const analysis = {
            ...analysisDoc.toObject(),
            resume_name: analysisDoc.resume_id ? analysisDoc.resume_id.original_name : 'Unknown Resume'
        };
        
        // Mock check for logged-in user (fallback user_id is 1)
        if (analysis.user_id && analysis.user_id !== 1) {
             return res.status(403).json({ success: false, message: 'Unauthorized to send this report' });
        }

        const getList = (arr) => {
            if (!arr) return '<li>None</li>';
            if (typeof arr === 'string') {
                try { arr = JSON.parse(arr); } catch { return '<li>None</li>'; }
            }
            if (!Array.isArray(arr) || arr.length === 0) return '<li>None</li>';
            return arr.map(i => `<li>${i}</li>`).join('');
        };

        const htmlBody = `
            <h2>Your Resume ATS Analysis Report</h2>
            <p><strong>Resume:</strong> ${analysis.resume_name}</p>
            <p><strong>General ATS Score:</strong> ${analysis.ats_score}/100</p>
            ${analysis.target_role ? `<p><strong>Target Role:</strong> ${analysis.target_role}</p>` : ''}
            ${analysis.target_role ? `<p><strong>Job Match Score:</strong> ${analysis.job_match_score}/100</p>` : ''}
            
            <h3>Summary</h3>
            <p>${analysis.summary}</p>

            <h3>Strengths</h3>
            <ul>${getList(analysis.strengths)}</ul>

            <h3>Weaknesses</h3>
            <ul>${getList(analysis.weaknesses)}</ul>

            ${analysis.missing_skills && analysis.missing_skills !== '[]' ? `
            <h3>Missing Skills</h3>
            <ul>${getList(analysis.missing_skills)}</ul>
            ` : ''}

            <h3>Suggestions</h3>
            <ul>${getList(analysis.suggestions)}</ul>

            <h3>ATS Recommendations</h3>
            <ul>${getList(analysis.ats_tips)}</ul>

            <br>
            <p>Regards,<br>Resume Lens Team</p>
        `;

        let pdfBuffer = null;
        try {
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            const pdfHtml = `
            <html>
                <head>
                    <style>
                        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #333; line-height: 1.6; }
                        h2 { color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px; margin-bottom: 20px; }
                        h3 { color: #2c3e50; margin-top: 25px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                        ul { padding-left: 20px; }
                        li { margin-bottom: 8px; }
                        p { margin-bottom: 15px; }
                    </style>
                </head>
                <body>
                    ${htmlBody}
                </body>
            </html>`;
            await page.setContent(pdfHtml, { waitUntil: 'networkidle0' });
            pdfBuffer = await page.pdf({ 
                format: 'A4', 
                printBackground: true, 
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' } 
            });
            await browser.close();
        } catch (pdfErr) {
            console.error("PDF generation failed:", pdfErr);
        }

        let userName = email.split('@')[0];
        userName = userName.charAt(0).toUpperCase() + userName.slice(1);
        const fileName = `${userName}_ATS_Report.pdf`;

        const emailOptions = {
            from: 'Resume Lens <onboarding@resend.dev>',
            to: [email],
            subject: `Your Resume ATS Analysis Report — ${analysis.resume_name}`,
            html: htmlBody
        };

        if (pdfBuffer) {
            emailOptions.attachments = [
                {
                    filename: fileName,
                    content: pdfBuffer
                }
            ];
        }

        await resendClient.emails.send(emailOptions);

        res.json({ success: true, message: 'Report sent successfully' });
    } catch (err) {
        console.error("Email send error:", err.message || err);
        res.status(500).json({ success: false, message: 'Unable to send report: ' + (err.message || 'Unknown error') });
    }
});

module.exports = router;
