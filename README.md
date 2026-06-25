# Employee Agent

A full-stack AI agent MVP that helps you build and run online businesses. The agent can research leads, draft outreach emails, manage tasks, store business memories, and request your approval before taking sensitive actions.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Edit `.env` and add your DeepSeek API key:

```
DEEPSEEK_API_KEY=your_key_here
```

### 3. Run in development

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend (port 5173) concurrently.

Open **http://localhost:5173** in your browser.

## Required Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DEEPSEEK_API_KEY` | **Yes** | — | Your DeepSeek API key (get one at [platform.deepseek.com](https://platform.deepseek.com)) |
| `DEEPSEEK_BASE_URL` | No | `https://api.deepseek.com` | DeepSeek API base URL |
| `DEEPSEEK_MODEL` | No | `deepseek-chat` | Model to use |
| `PORT` | No | `3001` | Backend server port |
| `DB_PATH` | No | `./data/employee-agent.db` | SQLite database path |
| `PLAYWRIGHT_BROWSERS_PATH` | No | `/opt/pw-browsers` | Path to Playwright Chromium for browser tools |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both server and client in development mode |
| `npm run dev:server` | Start only the backend (tsx watch) |
| `npm run dev:client` | Start only the frontend (Vite) |
| `npm test` | Run all server tests |
| `npm run build:server` | Compile server TypeScript |
| `npm run build` | Build frontend for production |
| `npm start` | Run compiled production server |

## How DeepSeek Integration Works

The server uses the OpenAI-compatible API client (`openai` npm package) pointed at DeepSeek's endpoint. The `LLMClient` class (`server/llm/LLMClient.ts`) handles all AI calls.

The **ManagerAgent** runs a ReAct loop (up to 15 iterations):
1. Receives user message + conversation history
2. Calls DeepSeek with a system prompt listing available tools and current business context
3. Parses the response — if it's a JSON tool call, executes the tool and loops; if it's a final JSON response, streams it back to the user
4. Streams tokens via Server-Sent Events (SSE) to the frontend

## How the Approval System Works

Certain actions require human approval before execution. The agent creates an approval request by calling the `request_approval` tool, which saves a record to the database and returns a message like "waiting for human review."

Approval requests appear in the **Approval Queue** in the right panel of the UI.

### Risk Levels

| Level | Actions | Auto-execute? |
|-------|---------|---------------|
| `SAFE_AUTO` | Planning, memory, task management | ✅ Yes |
| `LOW_RISK_AUTO` | File creation, web reading, lead scoring | ✅ Yes |
| `APPROVAL_REQUIRED` | Sending emails, spending money, publishing | ❌ Human review |
| `BLOCKED` | Fraud, spam, security bypass | 🚫 Never |

### Spending Approval JSON Structure

When the agent requests a spend approval, the `payload` field contains:

```json
{
  "amount": 49,
  "currency": "USD",
  "interval": "monthly",
  "vendor": "Apollo.io",
  "why_needed": "To find verified contact emails for leads",
  "if_rejected": "Use Hunter.io free tier",
  "alternatives": "Hunter.io (50/mo free) or manual search",
  "expected_roi": "One booking covers ~6 months of cost"
}
```

## Architecture

```
server/
  index.ts              Express + WebSocket server
  db/
    schema.ts           SQLite table definitions
    index.ts            DB connection singleton
    seed.ts             Initial data seeding
  llm/
    LLMClient.ts        DeepSeek via OpenAI-compatible API
  agents/
    ManagerAgent.ts     ReAct loop orchestrator
    AgentOrchestrator.ts Top-level handler (history, streaming, WebSocket)
    ResearchAgent.ts    Market/lead research specialist
    BuilderAgent.ts     Content and copy specialist
    SalesAgent.ts       Outreach and follow-up specialist
    OperatorAgent.ts    File and browser operations
    MemoryAgent.ts      Knowledge management
    ReviewAgent.ts      Quality and risk checker
  tools/               22 typed tools across 8 categories
  services/            CRUD services for all entities
  safety/
    RiskPolicyEngine.ts Tool risk classification
  tests/               34 passing Vitest tests
```

## Current MVP Limitations

- Browser screenshot tool requires Chromium at `PLAYWRIGHT_BROWSERS_PATH`
- Email sending is approval-gated but not actually wired to a mail provider — it creates drafts
- No authentication or multi-user support
- The agent's web reading uses `curl` as a fallback when Chromium isn't available
- Streaming is character-by-character (not word-by-word) due to JSON response parsing

## Next Steps

- [ ] Wire email sending to SendGrid or Resend
- [ ] Add authentication (NextAuth or Clerk)
- [ ] Connect a real CRM (HubSpot, Pipedrive)
- [ ] Implement Playwright browser automation properly
- [ ] Add voice input / Whisper transcription
- [ ] Deploy to Railway or Fly.io
- [ ] Add usage tracking and token cost display
- [ ] Implement agent-to-agent delegation (Manager → Specialist calls)
