import { useState, useRef, useEffect } from 'react'
import { sendMessage, getState } from '../api'
import type { AppState, ToolEvent } from '../api'

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

export default function ChatPanel({ onStateChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

      // Refresh state after agent finishes
      try {
        const newState = await getState()
        onStateChange(newState)
      } catch {
        // ignore state refresh error
      }
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#a09c94' }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>👋</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#1c1b19', marginBottom: 6 }}>Ask your agent anything</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
              Try: "Find 10 local restaurants that need catering services" or "Draft a weekly report"
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

                {/* Tool calls */}
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

                {/* Response text */}
                {(msg.text || msg.streaming) && (
                  <div style={{
                    background: '#fff', border: '1px solid #e5e2db',
                    borderRadius: '2px 12px 12px 12px', padding: '13px 16px',
                    fontSize: 13.5, lineHeight: 1.6, color: '#1c1b19',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}>
                    {msg.text || (msg.streaming ? <span style={{ color: '#a09c94' }}>...</span> : null)}
                  </div>
                )}

                {/* Error state */}
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

      {/* Chat input */}
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
