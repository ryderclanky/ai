import { useState, useRef, useEffect } from 'react'
import { sendMessage, getState, getMessages, clearMessages } from '../api'
import type { AppState, ToolEvent, ChatMessage } from '../api'

// Repair JSON by escaping raw control characters inside string values.
function repairJSON(text: string): string {
  let result = ''
  let inString = false
  let escaped = false
  for (const ch of text) {
    if (escaped) { result += ch; escaped = false; continue }
    if (ch === '\\') { result += ch; escaped = true; continue }
    if (ch === '"') { inString = !inString; result += ch; continue }
    if (inString && ch === '\n') { result += '\\n'; continue }
    if (inString && ch === '\r') { result += '\\r'; continue }
    if (inString && ch === '\t') { result += '\\t'; continue }
    result += ch
  }
  return result
}

function extractResponse(raw: string): string {
  let trimmed = raw.trim()
  // Strip a surrounding markdown code fence
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]+?)\s*```$/)
  if (fence) trimmed = fence[1].trim()
  if (!trimmed.startsWith('{')) return raw.trim()

  // Try strict then repaired parse
  for (const candidate of [trimmed, repairJSON(trimmed)]) {
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>
      if (typeof parsed.response === 'string') return parsed.response
      if (typeof parsed.thought === 'string' && !parsed.response) return parsed.thought
    } catch {
      // try next
    }
  }

  // Closed "response":"..." field via regex (malformed but complete)
  const closed = trimmed.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (closed) {
    try { return JSON.parse(`"${closed[1]}"`) as string } catch { return closed[1] }
  }

  // Mid-stream partial: show whatever follows "response":" so the user
  // never sees the JSON scaffolding while tokens are still arriving.
  const partial = trimmed.match(/"response"\s*:\s*"([\s\S]*)$/)
  if (partial) {
    return partial[1]
      .replace(/"\s*[,}]?\s*$/, '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
  }

  // Looks like JSON but no response field yet — suppress the scaffolding
  return ''
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const isBullet = /^[-*•]\s+/.test(line)
    const content = isBullet ? line.replace(/^[-*•]\s+/, '') : line

    const parts = content.split(/(\*\*[^*]+\*\*)/)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      return part
    })

    if (isBullet) {
      return (
        <div key={i} style={{ display: 'flex', gap: 7, marginTop: i > 0 ? 4 : 0 }}>
          <span style={{ color: '#2563eb', flexShrink: 0, marginTop: 1 }}>›</span>
          <span>{rendered}</span>
        </div>
      )
    }
    return (
      <div key={i} style={{ marginTop: i > 0 && line ? 6 : i > 0 ? 4 : 0 }}>
        {rendered}
      </div>
    )
  })
}

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SpinnerIcon = () => (
  <div style={{
    width: 11, height: 11,
    border: '1.5px solid #3b82f6',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0
  }} />
)

interface ToolCall {
  name: string
  params: Record<string, unknown>
  result: unknown
  done: boolean
}

interface Message {
  id: number
  type: 'user' | 'agent'
  text: string
  streaming?: boolean
  toolCalls?: ToolCall[]
  error?: string
}

interface ChatPanelProps {
  onStateChange: (state: AppState) => void
}

function historyToMessages(history: ChatMessage[]): Message[] {
  return history.map((m, i) => ({
    id: i,
    type: m.role === 'user' ? 'user' : 'agent',
    text: m.content,
    streaming: false,
    toolCalls: [],
  }))
}

export default function ChatPanel({ onStateChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getMessages()
      .then(history => {
        setMessages(historyToMessages(history))
        setHistoryLoaded(true)
      })
      .catch(() => setHistoryLoaded(true))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: historyLoaded ? 'smooth' : 'instant' })
  }, [messages, historyLoaded])

  const handleClear = async () => {
    if (!confirm('Clear all chat history?')) return
    await clearMessages()
    setMessages([])
  }

  const send = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsgId = Date.now()
    const agentMsgId = userMsgId + 1

    setMessages(prev => [
      ...prev,
      { id: userMsgId, type: 'user', text },
      { id: agentMsgId, type: 'agent', text: '', streaming: true, toolCalls: [] }
    ])
    setInput('')
    setIsLoading(true)

    try {
      await sendMessage(
        text,
        (token) => {
          setMessages(prev => prev.map(m =>
            m.id === agentMsgId ? { ...m, text: m.text + token } : m
          ))
        },
        (toolEvent: ToolEvent) => {
          setMessages(prev => prev.map(m =>
            m.id === agentMsgId
              ? { ...m, toolCalls: [...(m.toolCalls ?? []), { name: toolEvent.name, params: toolEvent.params, result: toolEvent.result, done: true }] }
              : m
          ))
        }
      )

      try {
        const newState = await getState()
        onStateChange(newState)
      } catch { /* ignore */ }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === agentMsgId
          ? { ...m, text: '', error: String(err), streaming: false }
          : m
      ))
    } finally {
      setMessages(prev => prev.map(m =>
        m.id === agentMsgId ? { ...m, streaming: false } : m
      ))
      setIsLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
  }

  function formatToolName(name: string): string {
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, background: '#f3f2ef' }}>
      {/* Header bar */}
      <div style={{ padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e5e2db', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1c1b19' }}>Chat</div>
        {messages.length > 0 && (
          <button
            onClick={() => void handleClear()}
            style={{ background: 'none', border: 'none', fontSize: 11.5, color: '#a09c94', cursor: 'pointer', padding: '3px 6px', borderRadius: 5 }}
          >
            Clear history
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, minHeight: 0 }}>
        {messages.length === 0 && historyLoaded && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a09c94' }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>👋</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1c1b19', marginBottom: 6 }}>Ask your agent anything</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              Try: "Find 10 local restaurants that need catering services" or "Create a project for Q3 outreach"
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{ animation: 'fadeSlideUp 0.25s ease' }}>
            {msg.type === 'user' ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '68%', background: '#1c1b19', color: '#fff',
                  borderRadius: '12px 12px 2px 12px', padding: '10px 14px',
                  fontSize: 13.5, lineHeight: 1.55
                }}>
                  {msg.text}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '86%' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#a09c94', paddingLeft: 2, letterSpacing: '0.01em' }}>
                  Employee Agent
                </div>

                {(msg.toolCalls?.length ?? 0) > 0 && (
                  <div style={{
                    background: '#fff', border: '1px solid #e5e2db',
                    borderRadius: 8, padding: '12px 14px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#7a7670', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, background: '#3b82f6', borderRadius: '50%', animation: msg.streaming ? 'dotPulse 1.4s ease infinite' : undefined }} />
                      {msg.streaming ? 'Working...' : 'Completed'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {msg.toolCalls?.map((tool, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: tool.done ? '#16a34a' : '#3b82f6' }}>
                          {tool.done ? <CheckIcon /> : <SpinnerIcon />}
                          {formatToolName(tool.name)}
                        </div>
                      ))}
                      {msg.streaming && (msg.toolCalls?.length ?? 0) === 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#3b82f6' }}>
                          <SpinnerIcon />
                          Thinking...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(msg.text || msg.streaming) && (
                  <div style={{
                    background: '#fff', border: '1px solid #e5e2db',
                    borderRadius: '2px 12px 12px 12px', padding: '13px 16px',
                    fontSize: 13.5, lineHeight: 1.6, color: '#1c1b19',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    {msg.streaming && !msg.text ? (
                      <span style={{ color: '#a09c94' }}>
                        <span style={{ animation: 'dotPulse 1.4s ease infinite', display: 'inline-block' }}>●</span>
                        <span style={{ animation: 'dotPulse 1.4s ease infinite 0.2s', display: 'inline-block', margin: '0 3px' }}>●</span>
                        <span style={{ animation: 'dotPulse 1.4s ease infinite 0.4s', display: 'inline-block' }}>●</span>
                      </span>
                    ) : (
                      <>
                        {renderMarkdown(extractResponse(msg.text))}
                        {msg.streaming && (
                          <span style={{ display: 'inline-block', width: 2, height: '1em', background: '#1c1b19', marginLeft: 2, animation: 'blink 1s step-end infinite', verticalAlign: 'text-bottom' }} />
                        )}
                      </>
                    )}
                  </div>
                )}

                {msg.error && (
                  <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#991b1b'
                  }}>
                    {msg.error}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '12px 20px 14px', background: '#fff', borderTop: '1px solid #e5e2db', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#f7f6f3', border: '1px solid #e5e2db',
          borderRadius: 10, padding: '8px 12px'
        }}>
          <input
            type="text"
            placeholder="Ask your agent anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={isLoading}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13.5, color: '#1c1b19', opacity: isLoading ? 0.5 : 1 }}
          />
          <button
            onClick={() => void send()}
            disabled={isLoading || !input.trim()}
            style={{
              background: isLoading ? '#6b7280' : '#1c1b19', color: '#fff', border: 'none', borderRadius: 7,
              padding: '5px 13px', fontSize: 12, fontWeight: 500, cursor: isLoading ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em'
            }}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: '#b5b0a9', marginTop: 6, textAlign: 'center' }}>
          Agent can access tasks, memory, leads, files, and web pages.
        </div>
      </div>
    </main>
  )
}
