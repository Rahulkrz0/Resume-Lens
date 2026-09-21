const mongoose = require('mongoose');

// Connect to MongoDB
async function initDb() {
    try {
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL environment variable is missing.");
        }
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("=========================================");
        console.log("MongoDB connected successfully");
        console.log("=========================================");
    } catch (err) {
        console.error("=========================================");
        console.error("MongoDB Connection Error:");
        console.error(err.message || err);
        console.error("=========================================");
    }
}

// Initialize connection
initDb();

// Define Resume Schema
const resumeSchema = new mongoose.Schema({
    original_name: { type: String, required: true },
    stored_name: { type: String },
    file_path: { type: String },
    extracted_text: { type: String },
    resume_data: { type: String },
    template: { type: String },
    is_created: { type: Boolean, default: false },
    ats_score: { type: Number, default: 0 },
    uploaded_at: { type: Date, default: Date.now },
    last_analyzed_at: { type: Date },
    user_id: { type: String, default: '1' }
});

const Resume = mongoose.model('Resume', resumeSchema);

// Define Analysis Schema
const analysisSchema = new mongoose.Schema({
    resume_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    user_id: { type: String, default: '1' },
    ats_score: { type: Number, default: 0 },
    target_role: { type: String },
    job_match_score: { type: Number },
    job_description: { type: String },
    summary: { type: String },
    strengths: [String],
    weaknesses: [String],
    missing_skills: [String],
    suggestions: [String],
    ats_tips: [String],
    recommendation: { type: String },
    created_at: { type: Date, default: Date.now }
});

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = {
    Resume,
    Analysis
};
