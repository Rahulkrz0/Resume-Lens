const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { Resume, Analysis } = require('../database');

const router = express.Router();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

router.post('/analyze', async (req, res) => {
    const { resumeId, targetRole, jobDescription } = req.body;

    if (!resumeId) {
        return res.status(400).json({ error: 'Resume ID is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    try {
        const resume = await Resume.findById(resumeId).select('extracted_text user_id');
        
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const resumeText = resume.extracted_text;
        const userId = resume.user_id || 1; // Fallback to 1 if not present for some reason

        if (!resumeText || resumeText.trim() === '') {
            return res.status(400).json({ error: 'Resume text could not be extracted from this PDF.' });
        }

        const prompt = `You are an expert ATS (Applicant Tracking System) and professional resume reviewer.
You must perform a rigorous, deeply analytical evaluation of the provided resume text. DO NOT generate random or arbitrary scores. 

Resume Content:
${resumeText}

Target Role:
${targetRole || 'Not specified'}

Job Description:
${jobDescription || 'Not specified'}

Evaluation Criteria:
1. Skills & Keywords: Are the required skills for the role present? Are they hard skills or soft skills?
2. Sections & Structure: Does the resume have clear sections (Experience, Education, Projects)?
3. Experience & Impact: Does the experience section show measurable impact (metrics, numbers)?
4. Education & Projects: Are they relevant and clearly described?
5. ATS Formatting: Is the text easily parseable? Are there weird formatting artifacts?
6. Job-Specific Match: If a Target Role or Job Description is provided, heavily weigh the score based on keyword matching and relevance to the role.

Return ONLY a valid JSON object matching the exact structure below. Do not include markdown formatting like \`\`\`json.

Required JSON Structure:
{
  "atsScore": (Number between 0-100 based strictly on the evaluation criteria),
  "jobMatchScore": (Number between 0-100 based on matching the Target Role/Job Description. If not provided, make it equal to atsScore),
  "summary": "(A 2-3 sentence professional summary of the resume's quality)",
  "strengths": ["(strength 1)", "(strength 2)"],
  "weaknesses": ["(weakness 1)", "(weakness 2)"],
  "missingSkills": ["(skill 1)", "(skill 2)"],
  "suggestions": ["(actionable improvement 1)", "(actionable improvement 2)"],
  "atsTips": ["(ATS optimization tip 1)", "(ATS optimization tip 2)"],
  "recommendation": "(Final overall recommendation)"
}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
        });

        const rawText = response.text || "{}";
        let cleanText = rawText.trim();
        // Handle markdown JSON blocks if present
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
            cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();

        let analysisData;
        try {
            analysisData = JSON.parse(cleanText);
        } catch (e) {
            console.error("Failed to parse Gemini response:", rawText);
            return res.status(500).json({ 
                success: false, 
                message: "AI analysis failed due to JSON parsing.", 
                error: "Invalid JSON from Gemini: " + rawText.substring(0, 500), 
                code: "GEMINI_PARSE_ERROR" 
            });
        }

        const newAnalysis = new Analysis({
            resume_id: resumeId,
            user_id: userId,
            ats_score: analysisData.atsScore || 0,
            target_role: targetRole || null,
            job_match_score: analysisData.jobMatchScore || analysisData.atsScore || 0,
            job_description: jobDescription || null,
            summary: analysisData.summary || '',
            strengths: analysisData.strengths || [],
            weaknesses: analysisData.weaknesses || [],
            missing_skills: analysisData.missingSkills || [],
            suggestions: analysisData.suggestions || [],
            ats_tips: analysisData.atsTips || [],
            recommendation: analysisData.recommendation || ''
        });
        
        await newAnalysis.save();

        await Resume.findByIdAndUpdate(resumeId, {
            last_analyzed_at: new Date(),
            ats_score: analysisData.atsScore || 0
        });

        res.status(201).json({
            id: newAnalysis._id,
            message: 'Analysis complete'
        });

    } catch (err) {
        console.error("Gemini analysis failed", {
            error: err,
            message: err instanceof Error ? err.message : String(err)
        });
        
        return res.status(500).json({
            success: false,
            message: "AI analysis failed",
            error: err instanceof Error ? err.message : String(err),
            code: "GEMINI_ERROR"
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const analysis = await Analysis.findById(req.params.id);
        
        if (!analysis) {
            return res.status(404).json({ error: 'Analysis not found' });
        }

        res.json({
            ...analysis.toObject(),
            id: analysis._id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch analysis' });
    }
});

router.get('/resume/:resumeId', async (req, res) => {
    try {
        const analysis = await Analysis.findOne({ resume_id: req.params.resumeId }).sort({ created_at: -1 });
        
        if (!analysis) {
            return res.status(404).json({ error: 'No analysis found for this resume' });
        }

        res.json({
            ...analysis.toObject(),
            id: analysis._id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch analysis' });
    }
});

router.get('/history/all', async (req, res) => {
    try {
        const analyses = await Analysis.find().populate('resume_id', 'original_name').sort({ created_at: -1 });
        const history = analyses.map(a => ({
            id: a._id,
            resume_id: a.resume_id ? a.resume_id._id : null,
            ats_score: a.ats_score,
            target_role: a.target_role,
            created_at: a.created_at,
            resume_name: a.resume_id ? a.resume_id.original_name : 'Unknown Resume'
        }));
        
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

module.exports = router;
