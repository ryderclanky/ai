import { useState, useRef, useEffect } from 'react'
import { sendCodeMessage } from '../api'
import type { ToolEvent } from '../api'

function extractResponse(raw: string): string {
  let trimmed = raw.trim()
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]+?)\s*```$/)
  if (fence) trimmed = fence[1].trim()
  if (!trimmed.startsWith('{')) return raw.trim()
  const closed = trimmed.match(/"response"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (closed) { try { return JSON.parse(`"${closed[1]}"`) as string } catch { return closed[1] } }
  const partial = trimmed.match(/"response"\s*:\s*"([\s\S]*)$/)
  if (partial) return partial[1].replace(/"\s*[,}]?\s*$/, '').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"')
  return ''
}

function renderCode(text: string): React.ReactNode {
  // Split into fenced code blocks and prose
  const segments = text.split(/(```[\s\S]*?```)/g)
  return segments.map((seg, i) => {
    if (seg.startsWith('```')) {
      const body = seg.replace(/^```[a-z]*\n?/, '').replace(/```$/, '')
      return (
        <pre key={i} style={{
          background: '#0d1117', border: '1px solid #21262d', borderRadius: 6,
          padding: '10px 12px', overflowX: 'auto', fontSize: 11.5,
          fontFamily: "'DM Mono', monospace", color: '#c9d1d9', margin: '8px 0', lineHeight: 1.55
        }}>{body}</pre>
      )
    }
    return seg.split('\n').map((line, j) => {
      const parts = line.split(/(\*\*[^*]+\*\*)|(`[^`]+`)/g).filter(Boolean)
      return (
        <div key={`${i}-${j}`} style={{ minHeight: line ? undefined : 6 }}>
          {parts.map((part, k) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={k}>{part.slice(2, -2)}</strong>
            if (part.startsWith('`') && part.endsWith('`')) return <code key={k} style={{ background: '#1c2128', padding: '1px 5px', borderRadius: 4, fontFamily: "'DM Mono', monospace", fontSize: 11.5, color: '#79c0ff' }}>{part.slice(1, -1)}</code>
            return part
          })}
        </div>
      )
    })
  })
}

const toolIcon: Record<string, string> = {
  list_dir: '📁', read_file: '📄', write_file: '✏️', edit_file: '✏️', search: '🔍',
}

interface ToolCall { name: string; params: Record<string, unknown>; result: unknown }
interface Msg { id: number; role: 'user' | 'agent'; text: string; streaming?: boolean; tools?: ToolCall[]; error?: string }

export default function CodingAgentPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const history = messages
      .filter(m => !m.error)
      .map(m => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.role === 'agent' ? extractResponse(m.text) : m.text }))

    const userId = Date.now()
    const agentId = userId + 1
    setMessages(prev => [...prev,
      { id: userId, role: 'user', text },
      { id: agentId, role: 'agent', text: '', streaming: true, tools: [] }
    ])
    setInput('')
    setLoading(true)

    try {
      await sendCodeMessage(text, history,
        (token) => setMessages(prev => prev.map(m => m.id === agentId ? { ...m, text: m.text + token } : m)),
        (ev: ToolEvent) => setMessages(prev => prev.map(m => m.id === agentId ? { ...m, tools: [...(m.tools ?? []), { name: ev.name, params: ev.params, result: ev.result }] } : m)),
      )
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === agentId ? { ...m, text: '', error: String(err), streaming: false } : m))
    } finally {
      setMessages(prev => prev.map(m => m.id === agentId ? { ...m, streaming: false } : m))
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
  }

  function toolLabel(t: ToolCall): string {
    const p = t.params
    const target = (p.path ?? p.query ?? '') as string
    const ok = (t.result as { ok?: boolean })?.ok
    const summary = (t.result as { summary?: string })?.summary
    return `${toolIcon[t.name] ?? '⚙️'} ${t.name}${target ? ` ${target}` : ''}${summary ? ` — ${summary}` : ''}${ok === false ? ' ⚠️' : ''}`
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 440, zIndex: 200,
      background: '#161b22', borderLeft: '1px solid #30363d',
      display: 'flex', flexDirection: 'column',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.4)', animation: 'slideInRight 0.22s ease',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: '13px 16px', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M5.5 4L2.5 8L5.5 12" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.5 4L13.5 8L10.5 12" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e6edf3', letterSpacing: '-0.01em' }}>Forge</div>
            <div style={{ fontSize: 10.5, color: '#7d8590' }}>Coding agent · edits this app's source</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7d8590', fontSize: 20, lineHeight: 1, cursor: 'pointer', padding: 4 }}>×</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ color: '#7d8590', fontSize: 12.5, lineHeight: 1.6, padding: '8px 2px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 8 }}>Forge can edit this codebase.</div>
            It can read, search, and modify the React + Express source directly. Try:
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Change the login button color to purple', 'Add a "Customers" tab next to Leads', 'What does extractResponse do in ChatPanel?'].map(s => (
                <button key={s} onClick={() => setInput(s)} style={{ textAlign: 'left', background: '#21262d', border: '1px solid #30363d', borderRadius: 7, padding: '8px 11px', fontSize: 12, color: '#c9d1d9', cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          msg.role === 'user' ? (
            <div key={msg.id} style={{ alignSelf: 'flex-end', maxWidth: '85%', background: '#2563eb', color: '#fff', borderRadius: '10px 10px 2px 10px', padding: '8px 12px', fontSize: 12.5, lineHeight: 1.5 }}>
              {msg.text}
            </div>
          ) : (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(msg.tools?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {msg.tools?.map((t, i) => (
                    <div key={i} style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: (t.result as { ok?: boolean })?.ok === false ? '#f0883e' : '#56d364', background: '#0d1117', border: '1px solid #21262d', borderRadius: 6, padding: '5px 9px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                      {toolLabel(t)}
                    </div>
                  ))}
                </div>
              )}
              {msg.error ? (
                <div style={{ background: '#3d1518', border: '1px solid #5c1a1f', borderRadius: 7, padding: '10px 12px', fontSize: 12, color: '#ff7b72' }}>{msg.error}</div>
              ) : (msg.text || msg.streaming) && (
                <div style={{ fontSize: 12.5, lineHeight: 1.6, color: '#c9d1d9' }}>
                  {msg.streaming && !msg.text
                    ? <span style={{ color: '#7d8590' }}>Forge is working<span style={{ animation: 'dotPulse 1.4s ease infinite' }}>…</span></span>
                    : renderCode(extractResponse(msg.text))}
                  {msg.streaming && msg.text && <span style={{ display: 'inline-block', width: 2, height: '1em', background: '#56d364', marginLeft: 2, animation: 'blink 1s step-end infinite', verticalAlign: 'text-bottom' }} />}
                </div>
              )}
            </div>
          )
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px', borderTop: '1px solid #30363d', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: '#0d1117', border: '1px solid #30363d', borderRadius: 9, padding: '8px 10px' }}>
          <textarea
            placeholder="Ask Forge to change the code…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            rows={1}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12.5, color: '#e6edf3', resize: 'none', fontFamily: 'inherit', maxHeight: 80, opacity: loading ? 0.5 : 1 }}
          />
          <button onClick={() => void send()} disabled={loading || !input.trim()} style={{ background: loading || !input.trim() ? '#21262d' : 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 13px', fontSize: 12, fontWeight: 600, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer' }}>
            {loading ? '…' : 'Send'}
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#6e7681', marginTop: 6, textAlign: 'center' }}>
          Forge edits files live. Restart the dev server isn't needed — Vite hot-reloads.
        </div>
      </div>
    </div>
  )
}
