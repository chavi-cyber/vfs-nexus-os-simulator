
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

// Create the data folder if it doesn't exist.
fs.mkdirSync(dataDir, { recursive: true });

// Open or create the SQLite database.
const db = new DatabaseSync(
  path.join(dataDir, 'vfs_nexus.db')
);

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Create the database tables.
db.exec(`
  CREATE TABLE IF NOT EXISTS system_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    state_json TEXT NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    content TEXT DEFAULT '',
    size INTEGER DEFAULT 0,
    permissions TEXT DEFAULT 'rw-r--r--',
    blocks_json TEXT DEFAULT '[]',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS directories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS disk_blocks (
    block_number INTEGER PRIMARY KEY,
    file_id TEXT,
    track INTEGER,
    status TEXT DEFAULT 'free',
    FOREIGN KEY (file_id) REFERENCES files(id)
  );

  CREATE TABLE IF NOT EXISTS kernel_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS disk_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track INTEGER NOT NULL,
    algorithm TEXT,
    status TEXT DEFAULT 'pending',
    seek_distance INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('SQLite database initialized successfully.');

export default db;