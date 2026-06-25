import LLMClient from '../llm/LLMClient.js';
import type { Agent } from './Agent.js';

export class ResearchAgent implements Agent {
  name = 'ResearchAgent';
  private llm = new LLMClient();

  async run(task: string, context: string): Promise<string> {
    const response = await this.llm.complete([
      {
        role: 'system',
        content: `You are a research specialist for an online catering business.
You are skilled at finding market opportunities, researching competitors, and identifying qualified leads.
You provide concise, actionable research findings.

Business context:
${context}`,
      },
      { role: 'user', content: task },
    ]);
    return response.text;
  }
}

export default ResearchAgent;
