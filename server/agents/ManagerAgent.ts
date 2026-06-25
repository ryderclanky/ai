import LLMClient from '../llm/LLMClient.js';
import type { ToolRegistry } from '../tools/ToolRegistry.js';
import { RiskPolicyEngine } from '../safety/RiskPolicyEngine.js';
import { ActionLogService } from '../services/ActionLogService.js';

const MAX_ITERATIONS = 15;

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onTool: (name: string, params: Record<string, unknown>, result: unknown) => void;
  onError: (error: Error) => void;
}

export class ManagerAgent {
  private llm: LLMClient;
  private tools: ToolRegistry;
  private riskEngine: RiskPolicyEngine;
  private actionLog: ActionLogService;

  constructor(tools: ToolRegistry) {
    this.llm = new LLMClient();
    this.tools = tools;
    this.riskEngine = new RiskPolicyEngine();
    this.actionLog = new ActionLogService();
  }

  async run(
    userMessage: string,
    history: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    context: string,
    callbacks: StreamCallbacks
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];

    let iterations = 0;
    const toolResults: string[] = [];

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      let responseText: string;
      try {
        const response = await this.llm.complete(messages);
        responseText = response.text;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        callbacks.onError(error);
        return error.message;
      }

      // Try to parse as JSON (tool call or final response)
      const parsed = this.tryParseJSON(responseText);

      if (parsed && typeof parsed === 'object' && parsed !== null) {
        const obj = parsed as Record<string, unknown>;

        // Final response
        if ('response' in obj && typeof obj.response === 'string') {
          const finalText = obj.response;
          // Stream the final response token by token
          for (const char of finalText) {
            callbacks.onToken(char);
          }
          return finalText;
        }

        // Tool call
        if ('action' in obj && typeof obj.action === 'string') {
          const toolName = obj.action;
          const params = (obj.params as Record<string, unknown>) || {};
          const thought = (obj.thought as string) || '';

          // Check risk
          const riskLevel = this.riskEngine.classify(toolName, params);

          if (this.riskEngine.isBlocked(riskLevel)) {
            const errorMsg = `Action blocked: ${toolName} is not permitted. ${this.riskEngine.describe(riskLevel)}`;
            this.actionLog.log(`Blocked tool call: ${toolName}`, JSON.stringify(params), 'error', 'ManagerAgent');
            messages.push({
              role: 'assistant',
              content: responseText,
            });
            messages.push({
              role: 'user',
              content: `Tool result for ${toolName}: ERROR - ${errorMsg}`,
            });
            toolResults.push(`BLOCKED: ${toolName}`);
            continue;
          }

          if (this.riskEngine.requiresApproval(riskLevel)) {
            // Log the intent and proceed — tool handler will create an approval record
          }

          // Execute tool
          let toolResult: unknown;
          try {
            toolResult = await this.tools.invoke(toolName, params);
            this.actionLog.log(
              `Tool: ${toolName}`,
              thought || JSON.stringify(params).slice(0, 200),
              'success',
              'ManagerAgent'
            );
          } catch (err) {
            toolResult = { error: String(err) };
            this.actionLog.log(`Tool: ${toolName}`, String(err), 'error', 'ManagerAgent');
          }

          callbacks.onTool(toolName, params, toolResult);

          messages.push({ role: 'assistant', content: responseText });
          messages.push({
            role: 'user',
            content: `Tool result for ${toolName}: ${JSON.stringify(toolResult)}`,
          });
          toolResults.push(`${toolName}: done`);
          continue;
        }
      }

      // Not JSON or unrecognized — treat as final plain text response
      const finalText = responseText;
      for (const char of finalText) {
        callbacks.onToken(char);
      }
      return finalText;
    }

    const timeoutMsg = 'I reached the maximum number of steps. Here is a summary of what I did: ' + toolResults.join(', ');
    for (const char of timeoutMsg) {
      callbacks.onToken(char);
    }
    return timeoutMsg;
  }

  private buildSystemPrompt(context: string): string {
    return `You are Employee Agent, a smart AI assistant that helps build and run online businesses.
You are capable, practical, and always explain your thinking.

You have access to these tools:
${this.tools.getToolList()}

When you need to use a tool, respond ONLY with valid JSON:
{
  "thought": "why you're using this tool",
  "action": "tool_name",
  "params": { ... }
}

When you have a final response for the user, respond ONLY with valid JSON:
{
  "thought": "summary of what you did",
  "response": "your message to the user"
}

Current business context:
${context}

Rules:
- Never send emails or spend money without creating an approval request first
- Always explain your plan before executing it
- Flag anything uncertain for approval
- Think step by step
- Use tools when needed, but don't use tools unnecessarily
- When you've completed the task, provide a clear final response`;
  }

  private tryParseJSON(text: string): unknown {
    const trimmed = text.trim();
    // Try direct parse
    try {
      return JSON.parse(trimmed);
    } catch {
      // Try to extract JSON from markdown code blocks
      const match = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
      if (match) {
        try {
          return JSON.parse(match[1]);
        } catch {
          // ignore
        }
      }
      return null;
    }
  }
}

export default ManagerAgent;
