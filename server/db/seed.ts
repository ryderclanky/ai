import { getDb } from './index.js';

export function seedDatabase(): void {
  const db = getDb();
  // Migrate: add projects table if it doesn't exist yet (safe on existing DBs)
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      deadline TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
  } catch { /* already exists */ }
}
