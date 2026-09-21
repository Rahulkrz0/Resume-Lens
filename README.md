# Resume Lens (Resume Analyzer)

A straightforward, professional Resume Analyzer application built with a simple stack to evaluate resumes against ATS (Applicant Tracking System) standards using Google Gemini AI.

## Features
- **User Authentication**: Register, login, and secure sessions (no Firebase, pure local auth).
- **Resume Management**: Upload PDF resumes, view, rename, and delete them.
- **ATS Analysis**: Get a general ATS score and feedback using AI.
- **Job Match Analysis**: Compare a resume against a specific target role and job description.
- **Dashboard**: Track total resumes, average ATS score, and recent activity.
- **History**: View past reports.
- **Printable Reports**: Generate a clean, professional report that can be printed or saved as PDF.

## Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (No React, No TypeScript).
- **Backend**: Node.js + Express.js.
- **Database**: SQLite (via `sqlite` and `sqlite3`).
- **AI Integration**: Google Gemini AI (`@google/genai`).
- **File Parsing**: `multer` for uploads, `pdf-parse` for text extraction.

## Folder Structure
```
Resume-Analyzer/
├── public/                 # Static frontend files (HTML/CSS/JS)
│   ├── css/style.css
│   ├── js/...
│   ├── index.html
│   └── ...
├── server/                 # Express backend
│   ├── routes/             # API routes
│   ├── database.js         # SQLite connection and schema
│   └── server.js           # Main Express server entry point
├── database/               # Local SQLite database file location
├── uploads/                # Local storage for uploaded PDF files
├── package.json
└── .env.example
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`.
   - Update `GEMINI_API_KEY` with your actual Google Gemini API key.

3. Start the server:
   ```bash
   npm start
   ```
   *For development with auto-reload, use `npm run dev`.*

4. Open your browser and navigate to `http://localhost:5000`

## How to use
1. Register a new account.
2. Go to the **Analyze Resume** page.
3. Upload a PDF resume.
4. (Optional) Provide a target role and Job Description.
5. Click **Analyze Resume** and wait for the AI to generate the report.
6. Check your Dashboard or History for saved reports.

## Database
The SQLite database automatically initializes its schema (`users`, `resumes`, `analyses` tables) on startup and stores data in `database/resume-analyzer.db`.
