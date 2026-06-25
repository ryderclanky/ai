import { getDb } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';

export interface Task {
  id: string;
  title: string;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export class TaskService {
  private db: Database.Database;

  constructor(db?: Database.Database) {
    this.db = db ?? getDb();
  }

  getAll(): Task[] {
    return this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as Task[];
  }

  getById(id: string): Task | undefined {
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
  }

  create(title: string, status = 'todo', note?: string): Task {
    const id = uuidv4();
    this.db.prepare(
      'INSERT INTO tasks (id, title, status, note) VALUES (?, ?, ?, ?)'
    ).run(id, title, status, note ?? null);
    return this.getById(id)!;
  }

  update(id: string, updates: Partial<Pick<Task, 'title' | 'status' | 'note'>>): Task | undefined {
    const task = this.getById(id);
    if (!task) return undefined;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.note !== undefined) { fields.push('note = ?'); values.push(updates.note); }

    if (fields.length === 0) return task;

    fields.push('updated_at = datetime(\'now\')');
    values.push(id);

    this.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getById(id);
  }
}

export default TaskService;
