import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { ApprovalService } from '../services/ApprovalService.js';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      payload TEXT DEFAULT '{}',
      risk_level TEXT NOT NULL DEFAULT 'low',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );
  `);
});

describe('ApprovalService', () => {
  it('creates a pending approval', () => {
    const service = new ApprovalService(db);
    const approval = service.create('email', 'Send intro email', 'Send email to Restaurant X', { to: 'test@example.com' });

    expect(approval.type).toBe('email');
    expect(approval.title).toBe('Send intro email');
    expect(approval.status).toBe('pending');
    expect(approval.id).toBeTruthy();
  });

  it('approves a pending approval', () => {
    const service = new ApprovalService(db);
    const created = service.create('spend', 'Buy tool', 'Buy Apollo.io', { amount: 49 });
    const approved = service.approve(created.id);

    expect(approved?.status).toBe('approved');
    expect(approved?.resolved_at).toBeTruthy();
  });

  it('rejects a pending approval', () => {
    const service = new ApprovalService(db);
    const created = service.create('spend', 'Buy tool', 'Buy something', { amount: 100 });
    const rejected = service.reject(created.id);

    expect(rejected?.status).toBe('rejected');
    expect(rejected?.resolved_at).toBeTruthy();
  });

  it('returns undefined for non-existent approval', () => {
    const service = new ApprovalService(db);
    const result = service.approve('nonexistent-id');
    expect(result).toBeUndefined();
  });

  it('stores payload as JSON', () => {
    const service = new ApprovalService(db);
    const payload = { amount: 49, vendor: 'Apollo.io', interval: 'monthly' };
    const approval = service.create('spend', 'Test', 'Test desc', payload);

    const retrieved = service.getById(approval.id);
    expect(retrieved).toBeTruthy();
    const parsedPayload = JSON.parse(retrieved!.payload) as Record<string, unknown>;
    expect(parsedPayload.amount).toBe(49);
    expect(parsedPayload.vendor).toBe('Apollo.io');
  });

  it('filters approvals by status', () => {
    const service = new ApprovalService(db);
    const a1 = service.create('email', 'Email 1', 'desc', {});
    service.create('email', 'Email 2', 'desc', {});
    service.approve(a1.id);

    const pending = service.getAll('pending');
    const approved = service.getAll('approved');

    expect(pending).toHaveLength(1);
    expect(approved).toHaveLength(1);
  });

  it('counts pending approvals', () => {
    const service = new ApprovalService(db);
    service.create('email', 'E1', 'desc', {});
    service.create('spend', 'S1', 'desc', {});
    const a3 = service.create('playbook', 'P1', 'desc', {});
    service.approve(a3.id);

    expect(service.getPendingCount()).toBe(2);
  });
});
