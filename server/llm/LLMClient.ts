import OpenAI from 'openai';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  text: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export class LLMClient {
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    this.client = new OpenAI({
      apiKey: apiKey || 'missing',
      baseURL,
    });
  }

  async complete(
    messages: LLMMessage[],
    options?: { json?: boolean; stream?: boolean }
  ): Promise<LLMResponse> {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('Please set DEEPSEEK_API_KEY in your .env file to enable AI responses.');
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      response_format: options?.json ? { type: 'json_object' } : undefined,
    });

    const choice = response.choices[0];
    return {
      text: choice.message.content || '',
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
          }
        : undefined,
    };
  }

  async *stream(messages: LLMMessage[]): AsyncGenerator<string> {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('Please set DEEPSEEK_API_KEY in your .env file to enable AI responses.');
    }

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}

export default LLMClient;
