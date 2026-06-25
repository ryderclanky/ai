import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { seedDatabase } from './db/seed.js';
import { AgentOrchestrator } from './agents/AgentOrchestrator.js';
import { ApprovalService } from './services/ApprovalService.js';
import { TaskService } from './services/TaskService.js';
import { MemoryService } from './services/MemoryService.js';
import { LeadService } from './services/LeadService.js';
import { ActionLogService } from './services/ActionLogService.js';
import { getDb } from './db/index.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

// Initialize DB and seed
seedDatabase();

const app = express();
app.use(cors());
app.use(express.json());

// Services
const orchestrator = new AgentOrchestrator();
const approvalService = new ApprovalService();
const taskService = new TaskService();
const memoryService = new MemoryService();
const leadService = new LeadService();
const actionLogService = new ActionLogService();

// ─── Health ────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── State ─────────────────────────────────────────────────────────────────

app.get('/api/state', (_req, res) => {
  const state = orchestrator.getState();
  res.json(state);
});

// ─── Chat (SSE) ─────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    res.status(503).json({
      error: 'Please set DEEPSEEK_API_KEY in your .env file to enable AI responses.'
    });
    return;
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (data: { type: string; data: unknown }) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await orchestrator.handleMessage(message, sendEvent);
    sendEvent({ type: 'done', data: null });
  } catch (err) {
    sendEvent({ type: 'error', data: String(err) });
  } finally {
    res.end();
  }
});

// ─── Approvals ─────────────────────────────────────────────────────────────

app.get('/api/approvals', (_req, res) => {
  const approvals = approvalService.getAll();
  res.json(approvals);
});

app.post('/api/approvals/:id/approve', (req, res) => {
  const approval = approvalService.approve(req.params.id);
  if (!approval) {
    res.status(404).json({ error: 'Approval not found' });
    return;
  }
  actionLogService.log(`Approved: ${approval.title}`, undefined, 'success', 'human');
  res.json(approval);
});

app.post('/api/approvals/:id/reject', (req, res) => {
  const approval = approvalService.reject(req.params.id);
  if (!approval) {
    res.status(404).json({ error: 'Approval not found' });
    return;
  }
  actionLogService.log(`Rejected: ${approval.title}`, undefined, 'warning', 'human');
  res.json(approval);
});

// ─── Tasks ─────────────────────────────────────────────────────────────────

app.get('/api/tasks', (_req, res) => {
  res.json(taskService.getAll());
});

app.post('/api/tasks', (req, res) => {
  const { title, status, note } = req.body as { title?: string; status?: string; note?: string };
  if (!title) {
    res.status(400).json({ error: 'title is required' });
    return;
  }
  const task = taskService.create(title, status, note);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const task = taskService.update(req.params.id, req.body as Parameters<typeof taskService.update>[1]);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  res.json(task);
});

// ─── Leads ─────────────────────────────────────────────────────────────────

app.get('/api/leads', (_req, res) => {
  res.json(leadService.getAll());
});

// ─── Memories ──────────────────────────────────────────────────────────────

app.get('/api/memories', (_req, res) => {
  res.json(memoryService.getAll());
});

// ─── Reports ───────────────────────────────────────────────────────────────

app.get('/api/reports', (_req, res) => {
  const db = getDb();
  const reports = db.prepare('SELECT * FROM business_reports ORDER BY created_at DESC').all();
  res.json(reports);
});

// ─── Action Logs ───────────────────────────────────────────────────────────

app.get('/api/action-logs', (_req, res) => {
  res.json(actionLogService.getAll());
});

// ─── Playbooks ─────────────────────────────────────────────────────────────

app.get('/api/playbooks', (_req, res) => {
  const db = getDb();
  const playbooks = db.prepare('SELECT * FROM playbooks ORDER BY created_at DESC').all();
  res.json(playbooks);
});

// ─── HTTP + WebSocket Server ────────────────────────────────────────────────

const server = createServer(app);
const wss = new WebSocketServer({ server });

orchestrator.attachWebSocket(wss);

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  // Send current state on connect
  ws.send(JSON.stringify({ type: 'state_update', data: orchestrator.getState() }));

  ws.on('close', () => console.log('WebSocket client disconnected'));
});

server.listen(PORT, () => {
  console.log(`Employee Agent server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);
});
