import type { Memory } from '../../api'

interface MemoryTabProps {
  memories: Memory[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function MemoryTab({ memories }: MemoryTabProps) {
  if (memories.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: '#a09c94', fontSize: 12.5 }}>
        No memories yet. The agent will learn and store insights as you work.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 680 }}>
      {memories.map(m => {
        let tags: string[] = []
        try { tags = JSON.parse(m.tags) as string[] } catch { /* ignore */ }

        return (
          <div key={m.id} style={{ background: '#f7f6f3', border: '1px solid #e5e2db', borderRadius: 8, padding: '11px 13px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 5, height: 5, background: '#3b82f6', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />
            <div>
              <div style={{ fontSize: 12.5, color: '#1c1b19', lineHeight: 1.45 }}>{m.content}</div>
              <div style={{ fontSize: 10.5, color: '#a09c94', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span>{timeAgo(m.created_at)} · {formatCategory(m.category)}</span>
                {tags.length > 0 && tags.map(tag => (
                  <span key={tag} style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 4, padding: '1px 6px', fontSize: 10 }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
