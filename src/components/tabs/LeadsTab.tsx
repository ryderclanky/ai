import type { Lead } from '../../api'

interface LeadsTabProps {
  leads: Lead[]
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'draft_ready': return { color: '#15803d', bg: '#dcfce7', label: 'Draft ready' }
    case 'in_review': return { color: '#92400e', bg: '#fffbeb', label: 'In review' }
    case 'contacted': return { color: '#1d4ed8', bg: '#eff6ff', label: 'Contacted' }
    case 'won': return { color: '#15803d', bg: '#dcfce7', label: 'Won' }
    case 'lost': return { color: '#991b1b', bg: '#fef2f2', label: 'Lost' }
    default: return { color: '#7a7670', bg: '#f3f2ef', label: 'New' }
  }
}

export default function LeadsTab({ leads }: LeadsTabProps) {
  if (leads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: '#a09c94', fontSize: 12.5 }}>
        No leads yet. Ask the agent to find leads for you.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
      {leads.map(lead => {
        const statusStyle = getStatusStyle(lead.status)
        return (
          <div key={lead.id} style={{ background: '#f7f6f3', border: '1px solid #e5e2db', borderRadius: 8, padding: '11px 13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1c1b19', lineHeight: 1.3 }}>{lead.name}</div>
              <span style={{ background: statusStyle.bg, color: statusStyle.color, borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 600, flexShrink: 0, marginLeft: 6 }}>
                {statusStyle.label}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#7a7670', marginBottom: 6 }}>
              {[lead.business_type, lead.seats ? `${lead.seats} seats` : null, lead.location].filter(Boolean).join(' · ')}
            </div>
            {lead.note && (
              <div style={{ fontSize: 11, color: '#5a5650', lineHeight: 1.4, fontStyle: 'italic' }}>"{lead.note}"</div>
            )}
            {lead.score > 0 && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ fontSize: 10, color: '#a09c94' }}>Score</div>
                <div style={{ flex: 1, height: 3, background: '#edebe7', borderRadius: 2 }}>
                  <div style={{ width: `${lead.score}%`, height: '100%', background: lead.score >= 75 ? '#22c55e' : lead.score >= 50 ? '#f59e0b' : '#ef4444', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#1c1b19' }}>{lead.score}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
