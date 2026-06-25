import type { ToolDefinition } from '../ToolRegistry.js';
import LeadService from '../../services/LeadService.js';

const leadService = new LeadService();

export const leadTools: ToolDefinition[] = [
  {
    name: 'add_lead',
    description: 'Add a new lead to the CRM',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Business name' },
        business_type: { type: 'string', description: 'Type of business (e.g. Italian restaurant)' },
        location: { type: 'string', description: 'Location or area' },
        seats: { type: 'number', description: 'Number of seats' },
        contact_email: { type: 'string', description: 'Contact email if known' },
        note: { type: 'string', description: 'Research notes or signals' },
        score: { type: 'number', description: 'Lead score 0-100' },
      },
      required: ['name'],
    },
    risk_level: 'LOW_RISK_AUTO',
    handler: async (params) => {
      const lead = leadService.add(
        params.name as string,
        params.business_type as string | undefined,
        params.location as string | undefined,
        params.seats as number | undefined,
        params.contact_email as string | undefined,
        params.note as string | undefined,
        (params.score as number) || 50
      );
      return { success: true, lead };
    },
  },
  {
    name: 'update_lead',
    description: 'Update an existing lead status or score',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Lead ID' },
        status: { type: 'string', description: 'New status: new, draft_ready, in_review, contacted, won, lost' },
        score: { type: 'number', description: 'Updated score 0-100' },
        note: { type: 'string', description: 'Updated notes' },
        contact_email: { type: 'string', description: 'Contact email' },
      },
      required: ['id'],
    },
    risk_level: 'LOW_RISK_AUTO',
    handler: async (params) => {
      const lead = leadService.update(params.id as string, {
        status: params.status as string | undefined,
        score: params.score as number | undefined,
        note: params.note as string | undefined,
        contact_email: params.contact_email as string | undefined,
      });
      if (!lead) return { success: false, error: 'Lead not found' };
      return { success: true, lead };
    },
  },
];
