interface HeaderProps {
  pendingCount: number
}

export default function Header({ pendingCount }: HeaderProps) {
  return (
    <header style={{
      height: 48, flexShrink: 0, background: '#fff',
      borderBottom: '1px solid #e5e2db', display: 'flex',
      alignItems: 'center', padding: '0 16px', gap: 12, zIndex: 20
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, background: '#1c1b19', borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="4.5" r="2.2" fill="#fff" />
            <path d="M2.5 12.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.02em', color: '#1c1b19' }}>
          Employee Agent
        </span>
      </div>

      <div style={{ width: 1, height: 18, background: '#e5e2db' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 7, height: 7, background: '#22c55e', borderRadius: '50%',
          animation: 'dotPulse 2s ease-in-out infinite'
        }} />
        <span style={{ fontSize: 12, color: '#7a7670' }}>Active · Local Restaurant Outreach</span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {pendingCount > 0 && (
          <div style={{
            background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 20,
            padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#92400e',
            display: 'flex', alignItems: 'center', gap: 5
          }}>
            <div style={{ width: 5, height: 5, background: '#f59e0b', borderRadius: '50%' }} />
            {pendingCount} approval{pendingCount !== 1 ? 's' : ''} waiting
          </div>
        )}
        <div style={{
          width: 28, height: 28, background: '#ede9e3', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, color: '#1c1b19', letterSpacing: '0.02em'
        }}>
          JD
        </div>
      </div>
    </header>
  )
}
