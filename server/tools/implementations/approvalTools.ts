import type { ToolDefinition } from '../ToolRegistry.js';
import ApprovalService from '../../services/ApprovalService.js';

const approvalService = new ApprovalService();

export const approvalTools: ToolDefinition[] = [
  {
    name: 'request_approval',
    description: 'Request human approval before taking a sensitive action (sending emails, spending money, publishing)',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Type: spend, email, publish, playbook, account_action' },
        title: { type: 'string', description: 'Short title for the approval request' },
        description: { type: 'string', description: 'Explanation of what you want to do and why' },
        payload: { type: 'object', description: 'Structured data about the action (amount, recipients, etc.)' },
        risk_level: { type: 'string', description: 'Risk level: safe, low, medium, high' },
      },
      required: ['type', 'title', 'description'],
    },
    risk_level: 'APPROVAL_REQUIRED',
    handler: async (params) => {
      const approval = approvalService.create(
        params.type as string,
        params.title as string,
        params.description as string,
        (params.payload as Record<string, unknown>) || {},
        (params.risk_level as string) || 'low'
      );
      return { success: true, approval, message: 'Approval request created — waiting for human review' };
    },
  },
];
