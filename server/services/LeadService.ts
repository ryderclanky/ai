import { getDb } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';

export interface Lead {
  id: string;
  name: string;
  business_type: string | null;
  location: string | null;
  seats: number | null;
  contact_email: string | null;
  status: string;
  score: number;
  note: string | null;
  created_at: string;
}

export class LeadService {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDb();
  }

  getAll(): Lead[] {
    return this.db.prepare('SELECT * FROM leads ORDER BY score DESC, created_at DESC').all() as Lead[];
  }

  getById(id: string): Lead | undefined {
    return this.db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as Lead | undefined;
  }

  add(
    name: string,
    business_type?: string,
    location?: string,
    seats?: number,
    contact_email?: string,
    note?: string,
    score = 50
  ): Lead {
    const id = uuidv4();
    this.db.prepare(
      'INSERT INTO leads (id, name, business_type, location, seats, contact_email, status, score, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, name, business_type ?? null, location ?? null, seats ?? null, contact_email ?? null, 'new', score, note ?? null);
    return this.getById(id)!;
  }

  update(id: string, updates: Partial<Pick<Lead, 'status' | 'score' | 'note' | 'contact_email'>>): Lead | undefined {
    const lead = this.getById(id);
    if (!lead) return undefined;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.score !== undefined) { fields.push('score = ?'); values.push(updates.score); }
    if (updates.note !== undefined) { fields.push('note = ?'); values.push(updates.note); }
    if (updates.contact_email !== undefined) { fields.push('contact_email = ?'); values.push(updates.contact_email); }

    if (fields.length === 0) return lead;
    values.push(id);

    this.db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  }

  score(id: string, score: number, note?: string): Lead | undefined {
    return this.update(id, { score, ...(note ? { note } : {}) });
  }
}

export default LeadService;
