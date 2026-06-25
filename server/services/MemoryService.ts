import { getDb } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';

export interface Memory {
  id: string;
  content: string;
  category: string;
  tags: string;
  created_at: string;
}

export class MemoryService {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDb();
  }

  getAll(): Memory[] {
    return this.db.prepare('SELECT * FROM memories ORDER BY created_at DESC').all() as Memory[];
  }

  save(content: string, category = 'general', tags: string[] = []): Memory {
    const id = uuidv4();
    this.db.prepare(
      'INSERT INTO memories (id, content, category, tags) VALUES (?, ?, ?, ?)'
    ).run(id, content, category, JSON.stringify(tags));
    return this.db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as Memory;
  }

  search(query: string, category?: string): Memory[] {
    if (category) {
      return this.db.prepare(
        'SELECT * FROM memories WHERE category = ? AND (content LIKE ? OR tags LIKE ?) ORDER BY created_at DESC LIMIT 20'
      ).all(category, `%${query}%`, `%${query}%`) as Memory[];
    }
    return this.db.prepare(
      'SELECT * FROM memories WHERE content LIKE ? OR tags LIKE ? ORDER BY created_at DESC LIMIT 20'
    ).all(`%${query}%`, `%${query}%`) as Memory[];
  }
}

export default MemoryService;
