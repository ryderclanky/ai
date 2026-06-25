import type { Playbook } from '../../api'

interface PlaybooksTabProps {
  playbooks: Playbook[]
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'active': return { color: '#15803d', bg: '#dcfce7', label: 'Active' }
    case 'draft': return { color: '#7a7670', bg: '#f3f2ef', label: 'Draft' }
    case 'archived': return { color: '#a09c94', bg: '#f7f6f3', label: 'Archived' }
    default: return { color: '#7a7670', bg: '#f3f2ef', label: status }
  }
}

export default function PlaybooksTab({ playbooks }: PlaybooksTabProps) {
  if (playbooks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: '#a09c94', fontSize: 12.5 }}>
        No playbooks yet. The agent will create playbooks from successful patterns.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, maxWidth: 900 }}>
      {playbooks.map(pb => {
        const statusStyle = getStatusStyle(pb.status)
        let steps: string[] = []
        try { steps = JSON.parse(pb.steps) as string[] } catch { /* ignore */ }

        return (
          <div key={pb.id} style={{ background: '#f7f6f3', border: '1px solid #e5e2db', borderRadius: 8, padding: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1c1b19' }}>{pb.name}</div>
              <span style={{ background: statusStyle.bg, color: statusStyle.color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>
                {statusStyle.label}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#7a7670', lineHeight: 1.45, marginBottom: steps.length > 0 ? 8 : 0 }}>
              {pb.description}
            </div>
            {steps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {steps.map((step, i) => (
                  <div key={i} style={{ fontSize: 10.5, color: '#5a5650', display: 'flex', gap: 5 }}>
                    <span style={{ color: '#a09c94', minWidth: 14 }}>{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
