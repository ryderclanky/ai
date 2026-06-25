import { getDb } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';

export interface ActionLog {
  id: string;
  action: string;
  detail: string | null;
  status: string;
  agent: string;
  created_at: string;
}

export class ActionLogService {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDb();
  }

  getAll(limit = 50): ActionLog[] {
    return this.db.prepare('SELECT * FROM action_logs ORDER BY created_at DESC LIMIT ?').all(limit) as ActionLog[];
  }

  log(action: string, detail?: string, status = 'success', agent = 'system'): ActionLog {
    const id = uuidv4();
    this.db.prepare(
      'INSERT INTO action_logs (id, action, detail, status, agent) VALUES (?, ?, ?, ?, ?)'
    ).run(id, action, detail ?? null, status, agent);
    return this.db.prepare('SELECT * FROM action_logs WHERE id = ?').get(id) as ActionLog;
  }
}

export default ActionLogService;
