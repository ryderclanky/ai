import type { RiskLevel } from '../safety/RiskPolicyEngine.js';

export interface ToolParameter {
  type: string;
  description?: string;
  enum?: string[];
  properties?: Record<string, ToolParameter>;
  items?: ToolParameter;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
  risk_level: RiskLevel;
  handler: (params: Record<string, unknown>) => Promise<unknown>;
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async invoke(name: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    return tool.handler(params);
  }

  getToolList(): string {
    return this.list()
      .map(t => `- ${t.name}: ${t.description} [risk: ${t.risk_level}]`)
      .join('\n');
  }
}

export default ToolRegistry;
