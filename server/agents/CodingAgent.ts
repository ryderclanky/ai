import path from 'path';
import fs from 'fs';
import LLMClient from '../llm/LLMClient.js';

// The coding agent operates on the project's own source tree. Root is the
// directory the server was launched from (package.json lives here in both
// `tsx` dev mode and compiled `node dist/...` mode, since npm scripts run
// from the project root).
const PROJECT_ROOT = process.cwd();

const IGNORED = new Set(['node_modules', '.git', 'dist', 'data', '.DS_Store']);
const MAX_FILE_BYTES = 60_000;
const MAX_ITERATIONS = 20;

export interface CodingStreamCallbacks {
  onToken: (token: string) => void;
  onTool: (name: string, params: Record<string, unknown>, result: unknown) => void;
  onError: (error: Error) => void;
}

interface ToolOutcome {
  ok: boolean;
  summary: string;
  detail: string;
}

// Resolve a user-supplied relative path against the project root and refuse
// anything that escapes it (path traversal / absolute paths outside root).
function resolveSafe(rel: string): string | null {
  const cleaned = rel.replace(/^[/\\]+/, '');
  const abs = path.resolve(PROJECT_ROOT, cleaned);
  if (abs !== PROJECT_ROOT && !abs.startsWith(PROJECT_ROOT + path.sep)) {
    return null;
  }
  return abs;
}

function relName(abs: string): string {
  return path.relative(PROJECT_ROOT, abs) || '.';
}

export class CodingAgent {
  private llm: LLMClient;

  constructor() {
    this.llm = new LLMClient();
  }

  async run(
    userMessage: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    callbacks: CodingStreamCallbacks
  ): Promise<string> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: this.systemPrompt() },
      ...history.slice(-12),
      { role: 'user', content: userMessage },
    ];

    let iterations = 0;
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      let responseText: string;
      try {
        const res = await this.llm.complete(messages);
        responseText = res.text;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        callbacks.onError(error);
        return error.message;
      }

      const parsed = this.parse(responseText);

      if (parsed && 'response' in parsed && typeof parsed.response === 'string') {
        const finalText = parsed.response;
        for (const ch of finalText) callbacks.onToken(ch);
        return finalText;
      }

      if (parsed && 'action' in parsed && typeof parsed.action === 'string') {
        const toolName = parsed.action;
        const params = (parsed.params as Record<string, unknown>) || {};
        const outcome = this.runTool(toolName, params);
        callbacks.onTool(toolName, params, { ok: outcome.ok, summary: outcome.summary });
        messages.push({ role: 'assistant', content: responseText });
        messages.push({
          role: 'user',
          content: `Result of ${toolName}: ${outcome.ok ? 'OK' : 'ERROR'} — ${outcome.summary}\n${outcome.detail}`,
        });
        continue;
      }

      // Couldn't parse a tool call or a response — surface whatever text we got.
      const extracted = this.extractField(responseText, 'response') ?? responseText;
      for (const ch of extracted) callbacks.onToken(ch);
      return extracted;
    }

    const msg = 'Reached the step limit before finishing. Try narrowing the request.';
    for (const ch of msg) callbacks.onToken(ch);
    return msg;
  }

  private runTool(name: string, params: Record<string, unknown>): ToolOutcome {
    try {
      switch (name) {
        case 'list_dir': return this.listDir(String(params.path ?? '.'));
        case 'read_file': return this.readFile(String(params.path ?? ''));
        case 'write_file': return this.writeFile(String(params.path ?? ''), String(params.content ?? ''));
        case 'edit_file': return this.editFile(String(params.path ?? ''), String(params.old ?? ''), String(params.new ?? ''));
        case 'search': return this.search(String(params.query ?? ''));
        default: return { ok: false, summary: `Unknown tool: ${name}`, detail: '' };
      }
    } catch (err) {
      return { ok: false, summary: String(err), detail: '' };
    }
  }

  private listDir(rel: string): ToolOutcome {
    const abs = resolveSafe(rel);
    if (!abs) return { ok: false, summary: 'Path outside project', detail: '' };
    if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
      return { ok: false, summary: `Not a directory: ${rel}`, detail: '' };
    }
    const entries = fs.readdirSync(abs)
      .filter(n => !IGNORED.has(n))
      .map(n => {
        const isDir = fs.statSync(path.join(abs, n)).isDirectory();
        return isDir ? `${n}/` : n;
      })
      .sort();
    return { ok: true, summary: `${entries.length} entries in ${relName(abs)}`, detail: entries.join('\n') };
  }

  private readFile(rel: string): ToolOutcome {
    const abs = resolveSafe(rel);
    if (!abs) return { ok: false, summary: 'Path outside project', detail: '' };
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      return { ok: false, summary: `File not found: ${rel}`, detail: '' };
    }
    let content = fs.readFileSync(abs, 'utf-8');
    let note = '';
    if (content.length > MAX_FILE_BYTES) {
      content = content.slice(0, MAX_FILE_BYTES);
      note = `\n…[truncated at ${MAX_FILE_BYTES} bytes]`;
    }
    return { ok: true, summary: `Read ${relName(abs)} (${content.length} bytes)`, detail: content + note };
  }

  private writeFile(rel: string, content: string): ToolOutcome {
    const abs = resolveSafe(rel);
    if (!abs) return { ok: false, summary: 'Path outside project', detail: '' };
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    const existed = fs.existsSync(abs);
    fs.writeFileSync(abs, content, 'utf-8');
    return { ok: true, summary: `${existed ? 'Overwrote' : 'Created'} ${relName(abs)} (${content.length} bytes)`, detail: '' };
  }

  private editFile(rel: string, oldStr: string, newStr: string): ToolOutcome {
    const abs = resolveSafe(rel);
    if (!abs) return { ok: false, summary: 'Path outside project', detail: '' };
    if (!fs.existsSync(abs)) return { ok: false, summary: `File not found: ${rel}`, detail: '' };
    const content = fs.readFileSync(abs, 'utf-8');
    if (!oldStr || !content.includes(oldStr)) {
      return { ok: false, summary: 'old string not found in file', detail: '' };
    }
    const occurrences = content.split(oldStr).length - 1;
    if (occurrences > 1) {
      return { ok: false, summary: `old string appears ${occurrences}× — make it unique`, detail: '' };
    }
    fs.writeFileSync(abs, content.replace(oldStr, newStr), 'utf-8');
    return { ok: true, summary: `Edited ${relName(abs)}`, detail: '' };
  }

  private search(query: string): ToolOutcome {
    if (!query) return { ok: false, summary: 'Empty query', detail: '' };
    const hits: string[] = [];
    const walk = (dir: string) => {
      if (hits.length >= 60) return;
      for (const name of fs.readdirSync(dir)) {
        if (IGNORED.has(name)) continue;
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) { walk(full); continue; }
        if (stat.size > MAX_FILE_BYTES) continue;
        if (!/\.(ts|tsx|js|jsx|json|css|md|html)$/.test(name)) continue;
        const lines = fs.readFileSync(full, 'utf-8').split('\n');
        lines.forEach((line, i) => {
          if (hits.length < 60 && line.toLowerCase().includes(query.toLowerCase())) {
            hits.push(`${relName(full)}:${i + 1}: ${line.trim().slice(0, 120)}`);
          }
        });
      }
    };
    walk(PROJECT_ROOT);
    return { ok: true, summary: `${hits.length} match(es) for "${query}"`, detail: hits.join('\n') };
  }

  private parse(text: string): Record<string, unknown> | null {
    const trimmed = text.trim();
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    const unfenced = fence ? fence[1].trim() : trimmed;
    for (const c of [trimmed, unfenced, this.repair(unfenced)]) {
      try {
        const v = JSON.parse(c) as unknown;
        if (v && typeof v === 'object') return v as Record<string, unknown>;
      } catch { /* next */ }
    }
    return null;
  }

  private repair(text: string): string {
    let out = '', inStr = false, esc = false;
    for (const ch of text) {
      if (esc) { out += ch; esc = false; continue; }
      if (ch === '\\') { out += ch; esc = true; continue; }
      if (ch === '"') { inStr = !inStr; out += ch; continue; }
      if (inStr && ch === '\n') { out += '\\n'; continue; }
      if (inStr && ch === '\r') { out += '\\r'; continue; }
      if (inStr && ch === '\t') { out += '\\t'; continue; }
      out += ch;
    }
    return out;
  }

  private extractField(text: string, field: string): string | null {
    const m = text.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    if (!m) return null;
    try { return JSON.parse(`"${m[1]}"`) as string; } catch { return m[1]; }
  }

  private systemPrompt(): string {
    return `You are Forge, a highly capable senior software engineer embedded inside the Employee Agent app. You can read and edit the app's own source code (a React + Vite + TypeScript frontend in src/ and an Express + SQLite backend in server/).

You work in a ReAct loop. On every turn respond with ONLY one JSON object — never prose outside JSON.

To use a tool:
{ "thought": "why", "action": "tool_name", "params": { ... } }

When you are done, give your final answer:
{ "thought": "summary", "response": "your message to the developer, in markdown" }

Available tools:
- list_dir   params: { "path": "src/components" }      → list a directory
- read_file  params: { "path": "src/App.tsx" }          → read a file
- write_file params: { "path": "...", "content": "..." } → create/overwrite a file
- edit_file  params: { "path": "...", "old": "...", "new": "..." } → replace an exact, unique snippet
- search     params: { "query": "extractResponse" }     → grep the source tree

Working rules:
- ALWAYS read a file before editing it. Prefer edit_file with a unique snippet over rewriting whole files.
- The "old" string in edit_file must match the file exactly and appear only once.
- Make minimal, correct changes that match the surrounding code style.
- Explain what you changed and why in your final response. Mention the files touched.
- Project root is the app directory; node_modules, .git, dist, and data are hidden from you.`;
  }
}

export default CodingAgent;
