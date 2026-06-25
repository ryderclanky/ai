export interface AgentContext {
  tasks?: unknown[];
  memories?: unknown[];
  leads?: unknown[];
  approvals?: unknown[];
}

export interface Agent {
  name: string;
  run(task: string, context: string): Promise<string>;
}
