import LLMClient from '../llm/LLMClient.js';
import type { Agent } from './Agent.js';

export class MemoryAgent implements Agent {
  name = 'MemoryAgent';
  private llm = new LLMClient();

  async run(task: string, context: string): Promise<string> {
    const response = await this.llm.complete([
      {
        role: 'system',
        content: `You are a memory and knowledge management specialist.
You identify important facts, rules, and lessons that should be stored for future reference.
You organise information into clear, retrievable memories.

Business context:
${context}`,
      },
      { role: 'user', content: task },
    ]);
    return response.text;
  }
}

export default MemoryAgent;
