import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { LeadService } from '../services/LeadService.js';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      business_type TEXT,
      location TEXT,
      seats INTEGER,
      contact_email TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      score INTEGER DEFAULT 0,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
});

describe('LeadService', () => {
  it('adds a new lead', () => {
    const service = new LeadService(db);
    const lead = service.add('Rosario Trattoria', 'Italian', 'Downtown', 80, undefined, 'Strong corporate dinner history');

    expect(lead.name).toBe('Rosario Trattoria');
    expect(lead.business_type).toBe('Italian');
    expect(lead.seats).toBe(80);
    expect(lead.status).toBe('new');
    expect(lead.id).toBeTruthy();
  });

  it('retrieves all leads sorted by score', () => {
    const service = new LeadService(db);
    service.add('Low Score Lead', undefined, undefined, undefined, undefined, undefined, 30);
    service.add('High Score Lead', undefined, undefined, undefined, undefined, undefined, 90);
    service.add('Medium Score Lead', undefined, undefined, undefined, undefined, undefined, 60);

    const leads = service.getAll();
    expect(leads[0].score).toBe(90);
    expect(leads[1].score).toBe(60);
    expect(leads[2].score).toBe(30);
  });

  it('updates lead status', () => {
    const service = new LeadService(db);
    const lead = service.add('Test Restaurant');
    const updated = service.update(lead.id, { status: 'draft_ready' });

    expect(updated?.status).toBe('draft_ready');
  });

  it('scores a lead', () => {
    const service = new LeadService(db);
    const lead = service.add('Test Bistro', 'American', 'Midtown', 100);
    const scored = service.score(lead.id, 88, 'Has corporate events page');

    expect(scored?.score).toBe(88);
    expect(scored?.note).toBe('Has corporate events page');
  });

  it('returns undefined when updating non-existent lead', () => {
    const service = new LeadService(db);
    const result = service.update('nonexistent-id', { status: 'won' });
    expect(result).toBeUndefined();
  });

  it('retrieves lead by id', () => {
    const service = new LeadService(db);
    const lead = service.add('Find Me Restaurant');
    const found = service.getById(lead.id);

    expect(found?.name).toBe('Find Me Restaurant');
  });

  it('adds lead with contact email', () => {
    const service = new LeadService(db);
    const lead = service.add('Contact Lead', 'Italian', 'Downtown', 60, 'contact@restaurant.com');
    expect(lead.contact_email).toBe('contact@restaurant.com');
  });
});
