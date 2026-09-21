require('dotenv').config();
const express = require('express');
const path = require('path');
const { getDb } = require('./database');

const resumesRoutes = require('./routes/resumes');
const analysisRoutes = require('./routes/analysis');
const builderRoutes = require('./routes/builder');
const emailRoutes = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/resumes', resumesRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/builder', builderRoutes);
app.use('/api/email', emailRoutes);

app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const db = getDb();
        const stats = await db.get(`
            SELECT 
                COUNT(*) as total_resumes,
                COUNT(ats_score) as analyzed,
                AVG(ats_score) as average_score
            FROM resumes
        `);

        const recentActivity = await db.all(`
            SELECT 'Analyzed resume: ' || original_name as activity_text, last_analyzed_at as date 
            FROM resumes WHERE last_analyzed_at IS NOT NULL
            UNION
            SELECT CASE WHEN is_created = 1 THEN 'Created a new resume: ' ELSE 'Uploaded resume: ' END || original_name as activity_text, uploaded_at as date 
            FROM resumes
            ORDER BY date DESC LIMIT 5
        `);

        res.json({
            totalResumes: stats.total_resumes || 0,
            averageScore: stats.average_score ? Math.round(stats.average_score) : '-',
            analyzedResumes: stats.analyzed || 0,
            recentActivity: recentActivity
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
