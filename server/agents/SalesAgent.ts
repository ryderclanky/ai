import LLMClient from '../llm/LLMClient.js';
import type { Agent } from './Agent.js';

export class SalesAgent implements Agent {
  name = 'SalesAgent';
  private llm = new LLMClient();

  async run(task: string, context: string): Promise<string> {
    const response = await this.llm.complete([
      {
        role: 'system',
        content: `You are a sales specialist for a catering business.
You draft effective outreach messages, follow-up sequences, and sales strategies.
You focus on personalisation, timing, and clear calls-to-action.

Business context:
${context}`,
      },
      { role: 'user', content: task },
    ]);
    return response.text;
  }
}

export default SalesAgent;
