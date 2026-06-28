import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'history.db');

// Enable WAL mode for better concurrency
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize tables if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    bookingId TEXT NOT NULL,
    driverPhone TEXT,
    timestamp INTEGER NOT NULL,
    status TEXT,
    vehicleLocation TEXT
  );

  CREATE TABLE IF NOT EXISTS receipt_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookingId TEXT NOT NULL,
    email TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'no',
    status TEXT NOT NULL DEFAULT 'pending',
    timestamp INTEGER NOT NULL
  );
`);

// Simple migration for existing table
try {
  db.exec("ALTER TABLE receipt_requests ADD COLUMN language TEXT NOT NULL DEFAULT 'no'");
} catch (e) {
  // Ignore error if column already exists
}

export default db;
