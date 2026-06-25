import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { MemoryService } from '../services/MemoryService.js';

let db: Database.Database;

beforeEach(() => {
  db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
});

describe('MemoryService', () => {
  it('saves a memory', () => {
    const service = new MemoryService(db);
    const mem = service.save('Keep emails under 90 words', 'preference', ['email']);

    expect(mem.content).toBe('Keep emails under 90 words');
    expect(mem.category).toBe('preference');
    expect(mem.id).toBeTruthy();
  });

  it('retrieves all memories', () => {
    const service = new MemoryService(db);
    service.save('Memory 1', 'general');
    service.save('Memory 2', 'strategy');

    const all = service.getAll();
    expect(all.length).toBe(2);
  });

  it('searches memories by keyword', () => {
    const service = new MemoryService(db);
    service.save('Restaurants with corporate packages are good leads', 'lead_scoring');
    service.save('Send emails on Tuesday morning', 'strategy');

    const results = service.search('corporate');
    expect(results).toHaveLength(1);
    expect(results[0].content).toContain('corporate');
  });

  it('searches memories by category', () => {
    const service = new MemoryService(db);
    service.save('Email tip 1', 'email_strategy');
    service.save('Email tip 2', 'email_strategy');
    service.save('Lead rule', 'lead_scoring');

    const results = service.search('tip', 'email_strategy');
    expect(results).toHaveLength(2);
  });

  it('returns empty array when no matches', () => {
    const service = new MemoryService(db);
    service.save('Something about emails', 'general');

    const results = service.search('quantum physics');
    expect(results).toHaveLength(0);
  });

  it('stores tags as JSON string', () => {
    const service = new MemoryService(db);
    const mem = service.save('Test memory', 'general', ['tag1', 'tag2', 'tag3']);
    const tags = JSON.parse(mem.tags) as string[];
    expect(tags).toContain('tag1');
    expect(tags).toHaveLength(3);
  });
});
