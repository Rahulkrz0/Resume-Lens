require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Resume } = require('./database');

const resumesRoutes = require('./routes/resumes');
const analysisRoutes = require('./routes/analysis');
const builderRoutes = require('./routes/builder');
const emailRoutes = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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
        const totalResumes = await Resume.countDocuments();
        const analyzedResumes = await Resume.countDocuments({ ats_score: { $gt: 0 } });
        
        const avgScoreResult = await Resume.aggregate([
            { $match: { ats_score: { $gt: 0 } } },
            { $group: { _id: null, avgScore: { $avg: '$ats_score' } } }
        ]);
        const averageScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : '-';

        const rawResumes = await Resume.find().sort({ uploaded_at: -1 }).limit(10);
        
        let activityList = [];
        for (const r of rawResumes) {
            if (r.last_analyzed_at) {
                activityList.push({
                    activity_text: 'Analyzed resume: ' + r.original_name,
                    date: r.last_analyzed_at
                });
            }
            activityList.push({
                activity_text: (r.is_created ? 'Created a new resume: ' : 'Uploaded resume: ') + r.original_name,
                date: r.uploaded_at
            });
        }
        
        activityList.sort((a, b) => new Date(b.date) - new Date(a.date));
        const recentActivity = activityList.slice(0, 5);

        res.json({
            totalResumes: totalResumes || 0,
            averageScore: averageScore,
            analyzedResumes: analyzedResumes || 0,
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
