import type { ToolDefinition } from '../ToolRegistry.js';
import { getDb } from '../../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export const reportTools: ToolDefinition[] = [
  {
    name: 'create_daily_report',
    description: 'Create a daily business summary report',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Report title' },
        content: { type: 'string', description: 'Report content/summary' },
        metrics: { type: 'object', description: 'Key metrics object (e.g. { leads_found: 12, emails_sent: 5 })' },
      },
      required: ['title', 'content'],
    },
    risk_level: 'LOW_RISK_AUTO',
    handler: async (params) => {
      const db = getDb();
      const id = uuidv4();
      db.prepare(
        'INSERT INTO business_reports (id, title, content, metrics) VALUES (?, ?, ?, ?)'
      ).run(id, params.title as string, params.content as string, JSON.stringify(params.metrics || {}));
      return { success: true, id };
    },
  },
];
