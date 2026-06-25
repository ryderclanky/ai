const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';

export interface Task {
  id: string;
  title: string;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  business_type: string | null;
  location: string | null;
  seats: number | null;
  contact_email: string | null;
  status: string;
  score: number;
  note: string | null;
  created_at: string;
}

export interface Memory {
  id: string;
  content: string;
  category: string;
  tags: string;
  created_at: string;
}

export interface Approval {
  id: string;
  type: string;
  title: string;
  description: string | null;
  payload: string;
  risk_level: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export interface ActionLog {
  id: string;
  action: string;
  detail: string | null;
  status: string;
  agent: string;
  created_at: string;
}

export interface Report {
  id: string;
  title: string;
  content: string | null;
  metrics: string;
  created_at: string;
}

export interface Playbook {
  id: string;
  name: string;
  description: string | null;
  steps: string;
  status: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AppState {
  tasks: Task[];
  approvals: Approval[];
  logs: ActionLog[];
  memories: Memory[];
  leads: Lead[];
  reports: Report[];
  playbooks: Playbook[];
}

export interface ToolEvent {
  name: string;
  params: Record<string, unknown>;
  result: unknown;
}

export async function getState(): Promise<AppState> {
  const res = await fetch(`${API_BASE}/api/state`);
  if (!res.ok) throw new Error('Failed to load state');
  return res.json() as Promise<AppState>;
}

export async function sendMessage(
  message: string,
  onToken: (t: string) => void,
  onTool: (t: ToolEvent) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error || 'Chat failed');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;
        try {
          const event = JSON.parse(jsonStr) as { type: string; data: unknown };
          if (event.type === 'token') {
            onToken(event.data as string);
          } else if (event.type === 'tool') {
            onTool(event.data as ToolEvent);
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  }
}

export async function sendCodeMessage(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  onToken: (t: string) => void,
  onTool: (t: ToolEvent) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/code-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error || 'Coding agent failed');
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;
      let event: { type: string; data: unknown } | null = null;
      try {
        event = JSON.parse(jsonStr) as { type: string; data: unknown };
      } catch {
        continue; // ignore malformed SSE frame
      }
      if (event.type === 'token') onToken(event.data as string);
      else if (event.type === 'tool') onTool(event.data as ToolEvent);
      else if (event.type === 'error') throw new Error(event.data as string);
    }
  }
}

export async function approveAction(id: string): Promise<Approval> {
  const res = await fetch(`${API_BASE}/api/approvals/${id}/approve`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve');
  return res.json() as Promise<Approval>;
}

export async function rejectAction(id: string): Promise<Approval> {
  const res = await fetch(`${API_BASE}/api/approvals/${id}/reject`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reject');
  return res.json() as Promise<Approval>;
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/api/tasks`);
  return res.json() as Promise<Task[]>;
}

export async function createTask(title: string, status?: string, note?: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, status, note }),
  });
  return res.json() as Promise<Task>;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json() as Promise<Task>;
}

export async function getLeads(): Promise<Lead[]> {
  const res = await fetch(`${API_BASE}/api/leads`);
  return res.json() as Promise<Lead[]>;
}

export async function getMemories(): Promise<Memory[]> {
  const res = await fetch(`${API_BASE}/api/memories`);
  return res.json() as Promise<Memory[]>;
}

export async function getReports(): Promise<Report[]> {
  const res = await fetch(`${API_BASE}/api/reports`);
  return res.json() as Promise<Report[]>;
}

export async function getPlaybooks(): Promise<Playbook[]> {
  const res = await fetch(`${API_BASE}/api/playbooks`);
  return res.json() as Promise<Playbook[]>;
}

export async function getMessages(): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE}/api/messages`);
  return res.json() as Promise<ChatMessage[]>;
}

export async function clearMessages(): Promise<void> {
  await fetch(`${API_BASE}/api/messages`, { method: 'DELETE' });
}

export async function resetAll(): Promise<void> {
  await fetch(`${API_BASE}/api/reset`, { method: 'POST' });
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/api/projects`);
  return res.json() as Promise<Project[]>;
}

export async function createProject(data: { name: string; description?: string; status?: string; deadline?: string }): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json() as Promise<Project>;
}

export async function updateProject(id: string, data: Partial<Project>): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json() as Promise<Project>;
}

export async function deleteProject(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE' });
}

export async function getLeadLogs(leadId: string): Promise<ActionLog[]> {
  const res = await fetch(`${API_BASE}/api/leads/${leadId}/logs`);
  return res.json() as Promise<ActionLog[]>;
}

// WebSocket connection for real-time updates
export function connectWebSocket(onUpdate: (state: AppState) => void): () => void {
  const wsUrl = API_BASE.replace(/^http/, 'ws');
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    try {
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; data: AppState };
          if (msg.type === 'state_update') {
            onUpdate(msg.data);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    } catch {
      reconnectTimer = setTimeout(connect, 3000);
    }
  };

  connect();

  return () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}
