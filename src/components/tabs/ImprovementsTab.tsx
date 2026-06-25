export default function ImprovementsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 680 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94' }}>
        Suggested Improvements
      </div>

      <div style={{ background: '#f7f6f3', border: '1px solid #e5e2db', borderRadius: 8, padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1c1b19' }}>Shorten outreach emails</div>
          <span style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 4, padding: '1px 7px', fontSize: 10, fontWeight: 600, color: '#92400e' }}>
            Suggested
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#5a5650', lineHeight: 1.6, marginBottom: 10, background: '#fff', border: '1px solid #e5e2db', borderRadius: 6, padding: '10px 12px' }}>
          The agent's outreach emails have been averaging 140 words. Response rates are higher on emails under 90 words in similar campaigns.
          <br />
          <strong style={{ color: '#1c1b19', fontWeight: 600 }}>Suggested fix:</strong> Keep all outreach emails under 90 words and include one real website observation.
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{ background: '#1c1b19', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Approve Improvement
          </button>
          <button style={{ background: '#fff', border: '1px solid #e5e2db', borderRadius: 7, padding: '7px 12px', fontSize: 12, color: '#7a7670', cursor: 'pointer', fontFamily: 'inherit' }}>
            Test First
          </button>
          <button style={{ background: '#fff', border: '1px solid #e5e2db', borderRadius: 7, padding: '7px 12px', fontSize: 12, color: '#7a7670', cursor: 'pointer', fontFamily: 'inherit' }}>
            Reject
          </button>
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginTop: 4 }}>
        Active Experiments
      </div>

      <div style={{ background: '#f7f6f3', border: '1px solid #e5e2db', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ width: 6, height: 6, background: '#a78bfa', borderRadius: '50%', flexShrink: 0, marginTop: 3, animation: 'dotPulse 2s ease infinite' }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: '#1c1b19' }}>Subject line A/B test</div>
            <span style={{ fontSize: 10.5, color: '#a09c94' }}>Running · Day 3 of 7</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#7a7670', marginTop: 3, lineHeight: 1.4 }}>
            Testing question vs. statement subject lines on cold outreach. No winner yet.
          </div>
        </div>
      </div>
    </div>
  )
}
