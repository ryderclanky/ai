import { useState, useEffect } from 'react'
import type { Lead, ActionLog } from '../../api'
import { getLeadLogs } from '../../api'

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

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [logs, setLogs] = useState<ActionLog[]>([])
  const statusStyle = getStatusStyle(lead.status)

  useEffect(() => {
    getLeadLogs(lead.id)
      .then(setLogs)
      .catch(() => setLogs([]))
  }, [lead.id])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
    }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)' }}
      />
      <div style={{
        position: 'relative', width: 380, height: '100%',
        background: '#fff', borderLeft: '1px solid #e5e2db',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        animation: 'slideInRight 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #e5e2db', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1c1b19', marginBottom: 4 }}>{lead.name}</div>
              <div style={{ fontSize: 11.5, color: '#7a7670' }}>
                {[lead.business_type, lead.location, lead.seats ? `${lead.seats} seats` : null].filter(Boolean).join(' · ')}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a09c94', fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <span style={{ background: statusStyle.bg, color: statusStyle.color, borderRadius: 5, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
              {statusStyle.label}
            </span>
            {lead.contact_email && (
              <span style={{ fontSize: 11.5, color: '#5a5650' }}>{lead.contact_email}</span>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Score */}
          {lead.score > 0 && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 8 }}>
                Lead Score
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 6, background: '#edebe7', borderRadius: 3 }}>
                  <div style={{
                    width: `${lead.score}%`, height: '100%',
                    background: lead.score >= 75 ? '#22c55e' : lead.score >= 50 ? '#f59e0b' : '#ef4444',
                    borderRadius: 3, transition: 'width 0.6s ease'
                  }} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1c1b19', fontFamily: "'DM Mono', monospace", minWidth: 30 }}>
                  {lead.score}
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          {lead.note && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 8 }}>
                Agent Notes
              </div>
              <div style={{ background: '#f7f6f3', border: '1px solid #e5e2db', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#1c1b19', lineHeight: 1.6, fontStyle: 'italic' }}>
                "{lead.note}"
              </div>
            </div>
          )}

          {/* Added date */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 8 }}>
              Added
            </div>
            <div style={{ fontSize: 12.5, color: '#5a5650' }}>{formatTime(lead.created_at)}</div>
          </div>

          {/* Action history */}
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 8 }}>
              Action History
            </div>
            {logs.length === 0 ? (
              <div style={{ fontSize: 12, color: '#a09c94', fontStyle: 'italic' }}>No actions recorded for this lead yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {logs.map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: 10, fontSize: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                      background: log.status === 'success' ? '#22c55e' : log.status === 'warning' ? '#f59e0b' : '#ef4444'
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#1c1b19', lineHeight: 1.4 }}>{log.action}</div>
                      {log.detail && <div style={{ color: '#7a7670', marginTop: 1 }}>{log.detail}</div>}
                      <div style={{ color: '#a09c94', fontSize: 10.5, marginTop: 2 }}>{log.agent} · {formatTime(log.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LeadsTab({ leads }: LeadsTabProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  if (leads.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: '#a09c94', fontSize: 12.5 }}>
        No leads yet. Ask the agent to find leads for you.
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
        {leads.map(lead => {
          const statusStyle = getStatusStyle(lead.status)
          return (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              style={{
                background: '#f7f6f3', border: '1px solid #e5e2db', borderRadius: 8, padding: '11px 13px',
                cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#1c1b19'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#e5e2db'
                ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
              }}
            >
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

      {selectedLead && (
        <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </>
  )
}
