const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { getDb } = require('../database');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (file.mimetype === 'application/pdf' || file.mimetype.includes('pdf') || ext === '.pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are accepted'));
        }
    }
});

router.get('/', async (req, res) => {
    try {
        const db = getDb();
        const resumes = await db.all('SELECT id, original_name, ats_score, uploaded_at, last_analyzed_at FROM resumes ORDER BY uploaded_at DESC');
        res.json(resumes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch resumes' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const db = getDb();
        const resume = await db.get('SELECT * FROM resumes WHERE id = ?', req.params.id);
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        res.json(resume);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch resume' });
    }
});

router.post('/upload', (req, res) => {
    // Inject a simple logger if not present
    if (!req.log) {
        req.log = {
            info: (obj, msg) => console.log(`[INFO] ${msg}`, obj),
            error: (obj, msg) => console.error(`[ERROR] ${msg}`, obj)
        };
    }

    upload.single('file')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, code: 'PDF_UPLOAD_ERROR', message: err.message || 'File upload failed' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, code: 'NO_FILE', message: 'No file uploaded' });
        }

        req.log.info({
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        }, "Resume PDF received");

        if (!req.file.buffer || req.file.buffer.length === 0) {
            return res.status(400).json({ success: false, code: 'EMPTY_PDF', message: 'Uploaded PDF is empty or could not be read.' });
        }

        try {
            const pdfBuffer = req.file.buffer;
            const result = await pdfParse(pdfBuffer);
            const text = (result.text || '').trim();

            if (!text) {
                return res.status(422).json({ success: false, code: 'NO_TEXT_EXTRACTED', message: 'Your PDF does not contain selectable text. Please upload a text-based PDF.' });
            }

            req.log.info({
                textLength: text.length
            }, "Resume PDF parsed successfully");

            let storedName = req.file.originalname;
            if (/^(client|file|resume|replit_resume)\.pdf$/i.test(storedName)) {
                storedName = `Resume_${Date.now()}.pdf`;
            }

            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(req.file.originalname);
            const filename = req.file.fieldname + '-' + uniqueSuffix + ext;
            const uploadDir = path.join(__dirname, '../../uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.join(uploadDir, filename);

            fs.writeFileSync(filePath, req.file.buffer);

            const db = getDb();
            const dbResult = await db.run(`
                INSERT INTO resumes (original_name, stored_name, file_path, extracted_text, user_id) 
                VALUES (?, ?, ?, ?, 1)
            `, storedName, filename, filePath, text);

            res.status(201).json({
                success: true,
                message: 'Upload successful',
                resume: {
                    id: dbResult.lastID,
                    filename: storedName,
                    extractedText: text
                }
            });
        } catch (parseErr) {
            req.log.error({
                error: parseErr instanceof Error ? parseErr.message : String(parseErr)
            }, "PDF parsing failed");
            
            return res.status(400).json({ 
                success: false, 
                code: 'PDF_PARSE_ERROR', 
                message: 'Unable to read this PDF. Please upload a valid PDF file.' 
            });
        }
    });
});

router.delete('/:id', async (req, res) => {
    try {
        const db = getDb();
        const resume = await db.get('SELECT file_path FROM resumes WHERE id = ?', req.params.id);
        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        if (fs.existsSync(resume.file_path)) {
            fs.unlinkSync(resume.file_path);
        }

        await db.run('DELETE FROM resumes WHERE id = ?', req.params.id);
        
        res.json({ message: 'Resume deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete resume' });
    }
});

router.put('/:id', async (req, res) => {
    const { original_name } = req.body;
    if (!original_name) {
        return res.status(400).json({ error: 'New name is required' });
    }

    try {
        const db = getDb();
        const result = await db.run('UPDATE resumes SET original_name = ? WHERE id = ?', original_name, req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        res.json({ message: 'Resume renamed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to rename resume' });
    }
});

module.exports = router;
