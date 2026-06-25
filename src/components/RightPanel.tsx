import type { Approval, ActionLog } from '../api'

interface RightPanelProps {
  approvals: Approval[]
  logs: ActionLog[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

function ApprovalButtons({ id, onApprove, onReject, approveLabel = 'Approve' }: {
  id: string
  onApprove: (id: string) => void
  onReject: (id: string) => void
  approveLabel?: string
}) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => onApprove(id)} style={{
        flex: 1, background: '#1c1b19', color: '#fff', border: 'none',
        borderRadius: 7, padding: '8px 0', fontSize: 12, fontWeight: 500,
        cursor: 'pointer', letterSpacing: '-0.01em'
      }}>
        {approveLabel}
      </button>
      <button onClick={() => onReject(id)} style={{
        background: '#fff', color: '#7a7670', border: '1px solid #e5e2db',
        borderRadius: 7, padding: '8px 10px', fontSize: 12, cursor: 'pointer'
      }}>
        Reject
      </button>
    </div>
  )
}

function getRiskBadge(riskLevel: string) {
  switch (riskLevel) {
    case 'safe': return { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', label: 'Safe' }
    case 'low': return { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', label: 'Low risk' }
    case 'medium': return { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', label: 'Medium risk' }
    case 'high': return { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', label: 'High risk' }
    default: return { bg: '#f7f6f3', border: '#e5e2db', color: '#7a7670', label: riskLevel }
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'spend':
      return (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <circle cx="5.5" cy="5.5" r="5" stroke="#d97706" strokeWidth="1" />
          <line x1="5.5" y1="3" x2="5.5" y2="6.2" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="5.5" cy="7.8" r="0.6" fill="#d97706" />
        </svg>
      )
    case 'email':
      return (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <rect x="1" y="2.5" width="9" height="6.5" rx="1.2" stroke="#7a7670" strokeWidth="1" />
          <path d="M1 4L5.5 7L10 4" stroke="#7a7670" strokeWidth="1" fill="none" />
        </svg>
      )
    case 'playbook':
      return (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <rect x="1.5" y="1" width="8" height="9" rx="1.2" stroke="#7a7670" strokeWidth="1" fill="none" />
          <line x1="3.5" y1="4" x2="7.5" y2="4" stroke="#7a7670" strokeWidth="0.9" />
          <line x1="3.5" y1="6" x2="7.5" y2="6" stroke="#7a7670" strokeWidth="0.9" />
        </svg>
      )
    default:
      return null
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'spend': return 'Spend Request'
    case 'email': return 'Send Email'
    case 'playbook': return 'Playbook Update'
    default: return type.charAt(0).toUpperCase() + type.slice(1)
  }
}

function getApproveLabel(type: string) {
  switch (type) {
    case 'spend': return 'Approve Spend'
    case 'email': return 'Approve & Send'
    default: return 'Approve'
  }
}

function getSpendDetails(payload: string) {
  try {
    const p = JSON.parse(payload) as Record<string, unknown>
    return p
  } catch {
    return {}
  }
}

function ApprovalCard({ approval, onApprove, onReject }: {
  approval: Approval
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const badge = getRiskBadge(approval.risk_level)
  const spendDetails = getSpendDetails(approval.payload)
  const amount = spendDetails.amount as number | undefined
  const interval = spendDetails.interval as string | undefined
  const vendor = spendDetails.vendor as string | undefined
  const whyNeeded = spendDetails.why_needed as string | undefined
  const ifRejected = spendDetails.if_rejected as string | undefined
  const alternatives = spendDetails.alternatives as string | undefined
  const expectedRoi = spendDetails.expected_roi as string | undefined

  const isSpend = approval.type === 'spend'
  const borderColor = isSpend ? '#fcd34d' : '#e5e2db'
  const bgColor = isSpend ? '#fffdf5' : '#fff'

  return (
    <div style={{
      background: bgColor, border: `${isSpend ? '1.5' : '1'}px solid ${borderColor}`, borderRadius: 9,
      padding: 14, animation: 'fadeSlideUp 0.2s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 9 }}>
        <div style={{
          fontSize: 10.5, fontWeight: 600,
          color: isSpend ? '#92400e' : '#7a7670',
          display: 'flex', alignItems: 'center', gap: 5,
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          {getTypeIcon(approval.type)}
          {getTypeLabel(approval.type)}
        </div>
        {isSpend && amount ? (
          <div style={{ background: '#1c1b19', color: '#fff', borderRadius: 5, padding: '2px 8px', fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>
            ${amount}{interval === 'monthly' ? '/mo' : ''}
          </div>
        ) : (
          <span style={{ background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: 4, padding: '1px 7px', fontSize: 10.5, fontWeight: 600, color: badge.color }}>
            {badge.label}
          </span>
        )}
      </div>

      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1c1b19', marginBottom: 1, letterSpacing: '-0.01em' }}>
        {approval.title}
      </div>

      {vendor && interval && (
        <div style={{ fontSize: 11, color: '#7a7670', marginBottom: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ background: '#f3f2ef', borderRadius: 4, padding: '1px 6px', fontSize: 10.5, fontWeight: 500 }}>
            {interval === 'monthly' ? 'Recurring monthly' : interval}
          </span>
          <span>·</span>
          <span>{vendor}</span>
        </div>
      )}

      {!vendor && approval.description && (
        <div style={{ fontSize: 11.5, color: '#7a7670', lineHeight: 1.5, marginBottom: 11 }}>
          {approval.description}
        </div>
      )}

      {isSpend && (whyNeeded || ifRejected || alternatives || expectedRoi) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 11, padding: 10, background: 'rgba(0,0,0,0.025)', borderRadius: 7 }}>
          {[
            { label: 'Why needed', text: whyNeeded },
            { label: 'If rejected', text: ifRejected },
            { label: 'Alternatives', text: alternatives },
            { label: 'Expected ROI', text: expectedRoi },
          ].filter(r => r.text).map((row, i, arr) => (
            <div key={row.label}>
              <div style={{ display: 'flex', gap: 8, fontSize: 11.5, lineHeight: 1.4 }}>
                <span style={{ color: '#a09c94', flexShrink: 0, width: 68, fontWeight: 500 }}>{row.label}</span>
                <span style={{ color: '#1c1b19' }}>{row.text}</span>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: '#edebe7', marginTop: 6 }} />}
            </div>
          ))}
        </div>
      )}

      {isSpend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
          <span style={{ fontSize: 11, color: '#a09c94' }}>Risk:</span>
          <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 4, padding: '1px 8px', fontSize: 10.5, fontWeight: 600 }}>Low</span>
          <span style={{ fontSize: 10.5, color: '#a09c94' }}>Cancel anytime, no penalty</span>
        </div>
      )}

      <ApprovalButtons
        id={approval.id}
        onApprove={onApprove}
        onReject={onReject}
        approveLabel={getApproveLabel(approval.type)}
      />
    </div>
  )
}

function getLogColor(status: string) {
  switch (status) {
    case 'success': return '#22c55e'
    case 'warning': return '#f59e0b'
    case 'error': return '#ef4444'
    default: return '#a09c94'
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function RightPanel({ approvals, logs, onApprove, onReject }: RightPanelProps) {
  const noApprovals = approvals.length === 0

  return (
    <aside style={{
      width: 288, flexShrink: 0, background: '#fff',
      borderLeft: '1px solid #e5e2db', display: 'flex',
      flexDirection: 'column', overflow: 'hidden'
    }}>
      <div style={{ padding: '13px 16px 10px', flexShrink: 0, borderBottom: '1px solid #edebe7' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1b19', letterSpacing: '-0.01em' }}>Approval Queue</span>
          {!noApprovals && (
            <span style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 600, color: '#92400e' }}>
              {approvals.length} waiting
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {approvals.map(approval => (
          <ApprovalCard
            key={approval.id}
            approval={approval}
            onApprove={onApprove}
            onReject={onReject}
          />
        ))}

        {noApprovals && (
          <div style={{ textAlign: 'center', padding: '28px 16px', color: '#a09c94' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1c1b19', marginBottom: 4 }}>All caught up</div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>No approvals waiting. The agent will flag anything new that needs your sign-off.</div>
          </div>
        )}

        {/* Recent Actions */}
        {logs.length > 0 && (
          <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid #edebe7' }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 9 }}>
              Recent Actions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {logs.slice(0, 8).map(log => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: getLogColor(log.status), flexShrink: 0, marginTop: 3 }} />
                  <div>
                    <div style={{ fontSize: 12, color: '#1c1b19', lineHeight: 1.35 }}>{log.action}</div>
                    <div style={{ fontSize: 10.5, color: '#a09c94', marginTop: 1 }}>{timeAgo(log.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
