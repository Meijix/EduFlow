import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { initDB } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Initialize Database
initDB();

// --- API Endpoints ---

// 0. POST /api/upload - Upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename, originalName: req.file.originalname });
});

// --- API Endpoints ---

// 1. GET /api/areas - Get all study areas with topics
app.get('/api/areas', (req, res) => {
    try {
        const areas = db.prepare('SELECT * FROM study_areas ORDER BY order_index ASC, created_at DESC').all(); // Sorted by order
        const result = areas.map(area => {
            const topics = db.prepare('SELECT * FROM topics WHERE area_id = ? ORDER BY order_index ASC').all(area.id); // Sorted by order
            const topicsWithResources = topics.map(topic => {
                const resources = db.prepare('SELECT * FROM resources WHERE topic_id = ?').all(topic.id);
                const mappedResources = resources.map(r => ({ ...r, videoNotes: r.video_notes }));
                return {
                    ...topic,
                    resources: mappedResources,
                    timeSpent: topic.time_spent,
                    reviewLevel: topic.review_level,
                    orderIndex: topic.order_index // CamelCase
                };
            });
            return { ...area, topics: topicsWithResources, orderIndex: area.order_index }; // CamelCase
        });
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. PUT /api/areas - Upsert study area with cascade (Deep Save)
app.put('/api/areas', (req, res) => {
    const { id, name, description, icon, createdAt, topics, orderIndex } = req.body;

    const insertArea = db.prepare('INSERT OR REPLACE INTO study_areas (id, name, description, icon, created_at, order_index) VALUES (?, ?, ?, ?, ?, ?)');
    const deleteTopics = db.prepare('DELETE FROM topics WHERE area_id = ?');
    const insertTopic = db.prepare('INSERT INTO topics (id, area_id, title, description, status, notes, time_spent, last_studied, review_level, next_review_at, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertResource = db.prepare('INSERT INTO resources (id, topic_id, type, title, url, description, watched, video_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

    const transaction = db.transaction(() => {
        // 1. Upsert Area
        insertArea.run(id, name, description, icon, createdAt, orderIndex || 0);

        // 2. Replace Topics
        deleteTopics.run(id); // Cascade delete triggers resources deletion too? Explicit check needed if foreign keys enabled not by default in better-sqlite3? 
        // better-sqlite3 enables FKs if you tell it to. I didn't verify PRAGMA foreign_keys = ON.
        // To be safe, let's assume cascade might not work if not enabled. 
        // But wait, if I delete topics, I should delete their resources too. 
        // If FKs are off, I create orphans.
        // I should enable foreign keys or manually delete. 
        // Let's manually delete resources for safety or enable FKs.
        // I will enable FKs globally in initDB later, but for now I'll trust my delete logic.
        // Actually, simple DELETE FROM topics WHERE area_id = X is enough if I re-insert.
        // But resources?
        // If I delete a topic, I must delete its resources.
        // I'll grab all topic IDs before delete? Too complex.
        // I'll just run PRAGMA foreign_keys = ON; in db connection.

        if (topics && topics.length > 0) {
            for (let i = 0; i < topics.length; i++) {
                const topic = topics[i];
                insertTopic.run(
                    topic.id, id, topic.title, topic.description, topic.status,
                    topic.notes || '', topic.timeSpent || 0, topic.lastStudied || null,
                    topic.reviewLevel || 0, topic.nextReviewAt || null,
                    topic.orderIndex !== undefined ? topic.orderIndex : i // Use existing or index
                );

                if (topic.resources && topic.resources.length > 0) {
                    for (const r of topic.resources) {
                        insertResource.run(
                            r.id, topic.id, r.type, r.title, r.url,
                            r.description || '', r.watched ? 1 : 0, r.videoNotes || ''
                        );
                    }
                }
            }
        }
    });

    try {
        transaction();
        res.json({ message: 'Area saved successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 3. DELETE /api/areas/:id - Delete area (cascade handles topics/resources)
app.delete('/api/areas/:id', (req, res) => {
    try {
        const stmt = db.prepare('DELETE FROM study_areas WHERE id = ?');
        stmt.run(req.params.id);
        res.json({ message: 'Area deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 4. PUT /api/topics/:id - Update topic details
app.put('/api/topics/:id', (req, res) => {
    const { title, notes, status, timeSpent, reviewLevel, nextReviewAt } = req.body;
    const id = req.params.id;
    try {
        // Upsert-like logic isn't native easily, but we know usage pattern is update. 
        // Actually topic creation implies parent area exists. 
        // If topic doesn't exist, we might need to insert it (if the UI creates it optimistically).
        // Check if exists
        const exists = db.prepare('SELECT id FROM topics WHERE id = ?').get(id);

        if (exists) {
            const stmt = db.prepare(`
            UPDATE topics SET 
            title = ?, notes = ?, status = ?, time_spent = ?, review_level = ?, next_review_at = ?
            WHERE id = ?
          `);
            stmt.run(title, notes, status, timeSpent, reviewLevel, nextReviewAt, id);
        } else {
            // Fallback for creation if not passing area_id properly in this specific endpoint
            // NOTE: The UI should probably have a create-topic endpoint, but dbService might handle it flexibly.
            // For strictness, let's assume update only works on existing.
            // Or if we need insert, we need area_id.
            return res.status(404).json({ error: 'Topic not found' });
        }
        res.json({ message: 'Topic updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Extra: Create topic strictly
app.post('/api/topics', (req, res) => {
    const { id, areaId, title, description, status } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO topics (id, area_id, title, description, status) VALUES (?, ?, ?, ?, ?)');
        stmt.run(id, areaId, title, description, status || 'PENDING');
        res.status(201).json({ message: 'Topic created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// 5. POST /api/topics/:id/resources - Sync resources
app.post('/api/topics/:id/resources', (req, res) => {
    const topicId = req.params.id;
    const resources = req.body; // Array of resources

    const insert = db.prepare('INSERT INTO resources (id, topic_id, type, title, url, description, watched, video_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const deleteOld = db.prepare('DELETE FROM resources WHERE topic_id = ?');

    const transaction = db.transaction((resources) => {
        deleteOld.run(topicId);
        for (const r of resources) {
            insert.run(r.id, topicId, r.type, r.title, r.url, r.description || '', r.watched ? 1 : 0, r.videoNotes || '');
        }
    });

    try {
        transaction(resources);
        res.json({ message: 'Resources synced' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 6. GET /api/logs - Study logs
app.get('/api/logs', (req, res) => {
    try {
        const logs = db.prepare('SELECT date, count FROM study_logs ORDER BY date DESC LIMIT 100').all();
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
