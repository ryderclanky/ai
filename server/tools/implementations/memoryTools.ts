import type { ToolDefinition } from '../ToolRegistry.js';
import MemoryService from '../../services/MemoryService.js';
import { getDb } from '../../db/index.js';
import { v4 as uuidv4 } from 'uuid';

const memoryService = new MemoryService();

export const memoryTools: ToolDefinition[] = [
  {
    name: 'save_memory',
    description: 'Save a fact, rule, or insight to long-term memory',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The content to remember' },
        category: { type: 'string', description: 'Category: preference, strategy, lead_scoring, business_goal, general' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for searching' },
      },
      required: ['content'],
    },
    risk_level: 'SAFE_AUTO',
    handler: async (params) => {
      const memory = memoryService.save(
        params.content as string,
        (params.category as string) || 'general',
        (params.tags as string[]) || []
      );
      return { success: true, memory };
    },
  },
  {
    name: 'search_memory',
    description: 'Search stored memories by keyword or category',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        category: { type: 'string', description: 'Optional category filter' },
      },
      required: ['query'],
    },
    risk_level: 'SAFE_AUTO',
    handler: async (params) => {
      const memories = memoryService.search(
        params.query as string,
        params.category as string | undefined
      );
      return { success: true, memories, count: memories.length };
    },
  },
  {
    name: 'save_lesson',
    description: 'Save a lesson learned from an experiment or outcome',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The lesson learned' },
        source: { type: 'string', description: 'Where this lesson came from' },
      },
      required: ['content'],
    },
    risk_level: 'SAFE_AUTO',
    handler: async (params) => {
      const db = getDb();
      const id = uuidv4();
      db.prepare('INSERT INTO lessons (id, content, source) VALUES (?, ?, ?)').run(
        id, params.content as string, (params.source as string) || null
      );
      return { success: true, id };
    },
  },
];
