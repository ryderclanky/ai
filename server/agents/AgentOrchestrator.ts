import { getDb } from '../db/index.js';
import { ToolRegistry } from '../tools/ToolRegistry.js';
import { ManagerAgent } from './ManagerAgent.js';
import { TaskService } from '../services/TaskService.js';
import { MemoryService } from '../services/MemoryService.js';
import { LeadService } from '../services/LeadService.js';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';

// Tool implementations
import { taskTools } from '../tools/implementations/taskTools.js';
import { memoryTools } from '../tools/implementations/memoryTools.js';
import { fileTools } from '../tools/implementations/fileTools.js';
import { browserTools } from '../tools/implementations/browserTools.js';
import { leadTools } from '../tools/implementations/leadTools.js';
import { reportTools } from '../tools/implementations/reportTools.js';
import { approvalTools } from '../tools/implementations/approvalTools.js';
import { improvementTools } from '../tools/implementations/improvementTools.js';

export type SSECallback = (event: { type: string; data: unknown }) => void;

export class AgentOrchestrator {
  private registry: ToolRegistry;
  private managerAgent: ManagerAgent;
  private taskService: TaskService;
  private memoryService: MemoryService;
  private leadService: LeadService;
  private wss?: WebSocketServer;

  constructor() {
    this.registry = new ToolRegistry();
    this.registerAllTools();
    this.managerAgent = new ManagerAgent(this.registry);
    this.taskService = new TaskService();
    this.memoryService = new MemoryService();
    this.leadService = new LeadService();
  }

  attachWebSocket(wss: WebSocketServer): void {
    this.wss = wss;
  }

  private registerAllTools(): void {
    const allTools = [
      ...taskTools,
      ...memoryTools,
      ...fileTools,
      ...browserTools,
      ...leadTools,
      ...reportTools,
      ...approvalTools,
      ...improvementTools,
    ];
    for (const tool of allTools) {
      this.registry.register(tool);
    }
  }

  async handleMessage(userMessage: string, onSSE: SSECallback): Promise<string> {
    const db = getDb();

    // Save user message
    const userMsgId = uuidv4();
    db.prepare('INSERT INTO messages (id, role, content) VALUES (?, ?, ?)').run(userMsgId, 'user', userMessage);

    // Load history (last 20 messages)
    const history = db.prepare(
      'SELECT role, content FROM messages ORDER BY created_at DESC LIMIT 20'
    ).all() as Array<{ role: 'user' | 'assistant'; content: string }>;
    // Reverse to chronological order (but exclude the message we just added)
    const chatHistory = history
      .filter(m => m.content !== userMessage)
      .reverse()
      .slice(-19);

    // Build context
    const context = this.buildContext();

    // Run manager agent
    let fullResponse = '';

    await this.managerAgent.run(
      userMessage,
      chatHistory,
      context,
      {
        onToken: (token) => {
          fullResponse += token;
          onSSE({ type: 'token', data: token });
        },
        onTool: (name, params, result) => {
          onSSE({ type: 'tool', data: { name, params, result } });
        },
        onError: (error) => {
          onSSE({ type: 'error', data: error.message });
        },
      }
    );

    // Save assistant response
    if (fullResponse) {
      const assistantMsgId = uuidv4();
      db.prepare('INSERT INTO messages (id, role, content) VALUES (?, ?, ?)').run(
        assistantMsgId, 'assistant', fullResponse
      );
    }

    // Broadcast state update to WebSocket clients
    this.broadcastStateUpdate();

    return fullResponse;
  }

  private buildContext(): string {
    const tasks = this.taskService.getAll().slice(0, 10);
    const memories = this.memoryService.getAll().slice(0, 5);
    const leads = this.leadService.getAll().slice(0, 5);

    return JSON.stringify({
      tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status })),
      memories: memories.map(m => ({ content: m.content, category: m.category })),
      leads: leads.map(l => ({ name: l.name, status: l.status, score: l.score })),
    }, null, 2);
  }

  private broadcastStateUpdate(): void {
    if (!this.wss) return;
    const state = this.getState();
    const message = JSON.stringify({ type: 'state_update', data: state });
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    });
  }

  getState() {
    const db = getDb();
    const tasks = this.taskService.getAll();
    const approvals = db.prepare('SELECT * FROM approvals ORDER BY created_at DESC').all();
    const logs = db.prepare('SELECT * FROM action_logs ORDER BY created_at DESC LIMIT 20').all();
    const memories = this.memoryService.getAll();
    const leads = this.leadService.getAll();
    const reports = db.prepare('SELECT * FROM business_reports ORDER BY created_at DESC').all();
    const playbooks = db.prepare('SELECT * FROM playbooks ORDER BY created_at DESC').all();

    return { tasks, approvals, logs, memories, leads, reports, playbooks };
  }
}

export default AgentOrchestrator;
