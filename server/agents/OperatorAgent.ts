import LLMClient from '../llm/LLMClient.js';
import type { Agent } from './Agent.js';

export class OperatorAgent implements Agent {
  name = 'OperatorAgent';
  private llm = new LLMClient();

  async run(task: string, context: string): Promise<string> {
    const response = await this.llm.complete([
      {
        role: 'system',
        content: `You are an operations specialist. You handle file management, browser interactions, and system operations.
You are precise and always verify before acting.

Business context:
${context}`,
      },
      { role: 'user', content: task },
    ]);
    return response.text;
  }
}

export default OperatorAgent;
