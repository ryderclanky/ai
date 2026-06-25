import LLMClient from '../llm/LLMClient.js';
import type { Agent } from './Agent.js';

export class ReviewAgent implements Agent {
  name = 'ReviewAgent';
  private llm = new LLMClient();

  async run(task: string, context: string): Promise<string> {
    const response = await this.llm.complete([
      {
        role: 'system',
        content: `You are a quality and risk reviewer for an online catering business.
You check work for accuracy, brand voice, risk, and potential issues before it goes out.
You flag anything uncertain or potentially problematic.

Business context:
${context}`,
      },
      { role: 'user', content: task },
    ]);
    return response.text;
  }
}

export default ReviewAgent;
