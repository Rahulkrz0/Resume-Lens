const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database/resume-analyzer.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

async function initDb() {
    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await dbInstance.exec(`
        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            original_name TEXT NOT NULL,
            stored_name TEXT,
            file_path TEXT,
            extracted_text TEXT,
            resume_data TEXT,
            template TEXT,
            is_created BOOLEAN DEFAULT 0,
            ats_score INTEGER,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_analyzed_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resume_id INTEGER NOT NULL,
            ats_score INTEGER,
            target_role TEXT,
            job_match_score INTEGER,
            job_description TEXT,
            summary TEXT,
            strengths TEXT,
            weaknesses TEXT,
            missing_skills TEXT,
            suggestions TEXT,
            ats_tips TEXT,
            recommendation TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resume_id) REFERENCES resumes (id) ON DELETE CASCADE
        );
    `);
    
    await dbInstance.exec('PRAGMA foreign_keys = ON;');
}

initDb().catch(err => {
    console.error("Failed to initialize database:", err);
});

module.exports = {
    getDb: () => dbInstance
};
