import type { ToolDefinition } from '../ToolRegistry.js';
import { getDb } from '../../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export const improvementTools: ToolDefinition[] = [
  {
    name: 'suggest_playbook_update',
    description: 'Suggest an update to an existing playbook based on learnings',
    parameters: {
      type: 'object',
      properties: {
        playbook_name: { type: 'string', description: 'Name of the playbook to update' },
        suggestion: { type: 'string', description: 'The suggested change or addition' },
        reason: { type: 'string', description: 'Why this update would help' },
      },
      required: ['playbook_name', 'suggestion'],
    },
    risk_level: 'LOW_RISK_AUTO',
    handler: async (params) => {
      const db = getDb();
      // Create an approval for playbook update
      const id = uuidv4();
      db.prepare(
        'INSERT INTO approvals (id, type, title, description, payload, risk_level, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        id,
        'playbook',
        `Playbook update: ${params.playbook_name as string}`,
        params.suggestion as string,
        JSON.stringify({ playbook: params.playbook_name, reason: params.reason }),
        'safe',
        'pending'
      );
      return { success: true, approval_id: id, message: 'Playbook update suggestion created for review' };
    },
  },
  {
    name: 'create_experiment',
    description: 'Create an A/B test or experiment to improve results',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Experiment name' },
        hypothesis: { type: 'string', description: 'What you expect to happen and why' },
      },
      required: ['name', 'hypothesis'],
    },
    risk_level: 'SAFE_AUTO',
    handler: async (params) => {
      const db = getDb();
      const id = uuidv4();
      db.prepare(
        'INSERT INTO experiments (id, name, hypothesis, status) VALUES (?, ?, ?, ?)'
      ).run(id, params.name as string, params.hypothesis as string, 'running');
      return { success: true, id };
    },
  },
  {
    name: 'score_result',
    description: 'Record the result of an experiment or action',
    parameters: {
      type: 'object',
      properties: {
        experiment_id: { type: 'string', description: 'ID of the experiment' },
        result: { type: 'string', description: 'The result and what it means' },
        status: { type: 'string', enum: ['success', 'failure', 'inconclusive'], description: 'Outcome' },
      },
      required: ['experiment_id', 'result'],
    },
    risk_level: 'SAFE_AUTO',
    handler: async (params) => {
      const db = getDb();
      db.prepare(
        'UPDATE experiments SET result = ?, status = ? WHERE id = ?'
      ).run(params.result as string, (params.status as string) || 'success', params.experiment_id as string);
      return { success: true };
    },
  },
  {
    name: 'draft_email',
    description: 'Draft an email to a lead or contact (requires approval to send)',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email or name' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body' },
      },
      required: ['to', 'subject', 'body'],
    },
    risk_level: 'APPROVAL_REQUIRED',
    handler: async (params) => {
      // Save draft to file
      const db = getDb();
      const id = uuidv4();
      const content = `To: ${params.to as string}\nSubject: ${params.subject as string}\n\n${params.body as string}`;
      db.prepare(
        'INSERT INTO approvals (id, type, title, description, payload, risk_level, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(
        id,
        'email',
        `Email to ${params.to as string}: ${params.subject as string}`,
        params.body as string,
        JSON.stringify({ to: params.to, subject: params.subject, body: params.body }),
        'low',
        'pending'
      );
      return { success: true, approval_id: id, draft: content, message: 'Email draft created — requires approval to send' };
    },
  },
];
