import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'database.sqlite');
const schemaPath = path.resolve(__dirname, '../database/schema.sql');

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

export function initDB() {
    console.log('Initializing database...');
    try {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);
        console.log('Database schema applied.');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
}

export default db;
