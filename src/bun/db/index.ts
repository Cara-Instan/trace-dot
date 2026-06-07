import { Database } from "bun:sqlite";
import path from "path";
import fs from "fs";

// import.meta.dir mengambil lokasi folder tempat file script ini disimpan
const DB_DIR = path.join(import.meta.dir, ".trace");
const DB_PATH = path.join(DB_DIR, "history.db");

fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.run("PRAGMA journal_mode = WAL");
db.run(`
  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT NOT NULL,
    input_files TEXT NOT NULL DEFAULT '[]',
    output_files TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    metadata TEXT
  )
`);
db.run(`CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_history_operation ON history(operation)`);

export default db;
