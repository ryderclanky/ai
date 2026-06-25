import { getDb } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';

export interface Approval {
  id: string;
  type: string;
  title: string;
  description: string | null;
  payload: string;
  risk_level: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export class ApprovalService {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDb();
  }

  getAll(status?: string): Approval[] {
    if (status) {
      return this.db.prepare('SELECT * FROM approvals WHERE status = ? ORDER BY created_at DESC').all(status) as Approval[];
    }
    return this.db.prepare('SELECT * FROM approvals ORDER BY created_at DESC').all() as Approval[];
  }

  getById(id: string): Approval | undefined {
    return this.db.prepare('SELECT * FROM approvals WHERE id = ?').get(id) as Approval | undefined;
  }

  create(
    type: string,
    title: string,
    description: string,
    payload: Record<string, unknown>,
    risk_level = 'low'
  ): Approval {
    const id = uuidv4();
    this.db.prepare(
      'INSERT INTO approvals (id, type, title, description, payload, risk_level, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, type, title, description, JSON.stringify(payload), risk_level, 'pending');
    return this.getById(id)!;
  }

  approve(id: string): Approval | undefined {
    this.db.prepare(
      "UPDATE approvals SET status = 'approved', resolved_at = datetime('now') WHERE id = ?"
    ).run(id);
    return this.getById(id);
  }

  reject(id: string): Approval | undefined {
    this.db.prepare(
      "UPDATE approvals SET status = 'rejected', resolved_at = datetime('now') WHERE id = ?"
    ).run(id);
    return this.getById(id);
  }

  getPendingCount(): number {
    const result = this.db.prepare("SELECT COUNT(*) as count FROM approvals WHERE status = 'pending'").get() as { count: number };
    return result.count;
  }
}

export default ApprovalService;
