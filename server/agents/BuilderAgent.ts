import LLMClient from '../llm/LLMClient.js';
import type { Agent } from './Agent.js';

export class BuilderAgent implements Agent {
  name = 'BuilderAgent';
  private llm = new LLMClient();

  async run(task: string, context: string): Promise<string> {
    const response = await this.llm.complete([
      {
        role: 'system',
        content: `You are a content and copy specialist for an online catering business.
You create compelling, personalized outreach emails, marketing copy, and business assets.
Your writing is concise (under 90 words for cold emails), personal, and action-oriented.

Business context:
${context}`,
      },
      { role: 'user', content: task },
    ]);
    return response.text;
  }
}

export default BuilderAgent;
