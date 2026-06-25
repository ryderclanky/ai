import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { seedDatabase } from './db/seed.js';
import { AgentOrchestrator } from './agents/AgentOrchestrator.js';
import { ApprovalService } from './services/ApprovalService.js';
import { TaskService } from './services/TaskService.js';
import { MemoryService } from './services/MemoryService.js';
import { LeadService } from './services/LeadService.js';
import { ActionLogService } from './services/ActionLogService.js';
import { getDb } from './db/index.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

seedDatabase();

const app = express();
app.use(cors());
app.use(express.json());

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

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (data: { type: string; data: unknown }) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // handleMessage persists both the user message and the assistant
    // response to the messages table — no extra save needed here.
    await orchestrator.handleMessage(message, sendEvent);
    sendEvent({ type: 'done', data: null });
  } catch (err) {
    sendEvent({ type: 'error', data: String(err) });
  } finally {
    res.end();
  }
});

// ─── Messages ──────────────────────────────────────────────────────────────

app.get('/api/messages', (_req, res) => {
  const db = getDb();
  const messages = db.prepare('SELECT * FROM messages ORDER BY created_at ASC').all();
  res.json(messages);
});

app.delete('/api/messages', (_req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM messages').run();
  res.json({ ok: true });
});

// ─── Reset ─────────────────────────────────────────────────────────────────

app.post('/api/reset', (_req, res) => {
  const db = getDb();
  db.exec(`
    DELETE FROM messages;
    DELETE FROM tasks;
    DELETE FROM leads;
    DELETE FROM customers;
    DELETE FROM memories;
    DELETE FROM approvals;
    DELETE FROM action_logs;
    DELETE FROM business_reports;
    DELETE FROM playbooks;
    DELETE FROM experiments;
    DELETE FROM lessons;
    DELETE FROM projects;
  `);
  res.json({ ok: true });
});

// ─── Approvals ─────────────────────────────────────────────────────────────

app.get('/api/approvals', (_req, res) => {
  const approvals = approvalService.getAll();
  res.json(approvals);
});

app.post('/api/approvals/:id/approve', (req, res) => {
  const approval = approvalService.approve(req.params.id);
  if (!approval) { res.status(404).json({ error: 'Approval not found' }); return; }
  actionLogService.log(`Approved: ${approval.title}`, undefined, 'success', 'human');
  res.json(approval);
});

app.post('/api/approvals/:id/reject', (req, res) => {
  const approval = approvalService.reject(req.params.id);
  if (!approval) { res.status(404).json({ error: 'Approval not found' }); return; }
  actionLogService.log(`Rejected: ${approval.title}`, undefined, 'warning', 'human');
  res.json(approval);
});

// ─── Tasks ─────────────────────────────────────────────────────────────────

app.get('/api/tasks', (_req, res) => {
  res.json(taskService.getAll());
});

app.post('/api/tasks', (req, res) => {
  const { title, status, note } = req.body as { title?: string; status?: string; note?: string };
  if (!title) { res.status(400).json({ error: 'title is required' }); return; }
  const task = taskService.create(title, status, note);
  res.status(201).json(task);
});

app.patch('/api/tasks/:id', (req, res) => {
  const task = taskService.update(req.params.id, req.body as Parameters<typeof taskService.update>[1]);
  if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── Leads ─────────────────────────────────────────────────────────────────

app.get('/api/leads', (_req, res) => {
  res.json(leadService.getAll());
});

app.get('/api/leads/:id/logs', (req, res) => {
  const db = getDb();
  const logs = db.prepare(`
    SELECT * FROM action_logs
    WHERE detail LIKE ? OR action LIKE ?
    ORDER BY created_at DESC LIMIT 20
  `).all(`%${req.params.id}%`, `%${req.params.id}%`);
  res.json(logs);
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

// ─── Projects ──────────────────────────────────────────────────────────────

app.get('/api/projects', (_req, res) => {
  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const { name, description, status, deadline } = req.body as {
    name?: string; description?: string; status?: string; deadline?: string;
  };
  if (!name) { res.status(400).json({ error: 'name is required' }); return; }
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO projects (id, name, description, status, deadline)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, name, description ?? null, status ?? 'active', deadline ?? null);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(project);
});

app.patch('/api/projects/:id', (req, res) => {
  const db = getDb();
  const { name, description, status, deadline } = req.body as {
    name?: string; description?: string; status?: string; deadline?: string;
  };
  const fields: string[] = [];
  const values: unknown[] = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (deadline !== undefined) { fields.push('deadline = ?'); values.push(deadline); }
  if (fields.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }
  fields.push('updated_at = datetime(\'now\')');
  values.push(req.params.id);
  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
  res.json(project);
});

app.delete('/api/projects/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ─── HTTP + WebSocket Server ────────────────────────────────────────────────

const server = createServer(app);
const wss = new WebSocketServer({ server });

orchestrator.attachWebSocket(wss);

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  ws.send(JSON.stringify({ type: 'state_update', data: orchestrator.getState() }));
  ws.on('close', () => console.log('WebSocket client disconnected'));
});

server.listen(PORT, () => {
  console.log(`Employee Agent server running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);
});
