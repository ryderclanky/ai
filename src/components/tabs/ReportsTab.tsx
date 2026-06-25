import type { Report } from '../../api'

interface ReportsTabProps {
  reports: Report[]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ReportsTab({ reports }: ReportsTabProps) {
  if (reports.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: '#a09c94', fontSize: 12.5 }}>
        No reports yet. Ask the agent to create a daily report.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 680 }}>
      {reports.map(report => {
        let metrics: Record<string, unknown> = {}
        try { metrics = JSON.parse(report.metrics) as Record<string, unknown> } catch { /* ignore */ }
        const metricEntries = Object.entries(metrics).slice(0, 3)

        return (
          <div key={report.id} style={{ background: '#f7f6f3', border: '1px solid #e5e2db', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1b19', marginBottom: 2 }}>{report.title}</div>
                <div style={{ fontSize: 11, color: '#a09c94' }}>Generated {formatTime(report.created_at)}</div>
              </div>
              <span style={{ background: '#f7f6f3', border: '1px solid #e5e2db', borderRadius: 5, padding: '2px 8px', fontSize: 11, color: '#7a7670' }}>
                {formatDate(report.created_at)}
              </span>
            </div>

            {metricEntries.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(metricEntries.length, 3)}, 1fr)`, gap: 8, marginBottom: 10 }}>
                {metricEntries.map(([key, value]) => (
                  <div key={key} style={{ background: '#fff', border: '1px solid #e5e2db', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1c1b19', fontFamily: "'DM Mono', monospace" }}>{String(value)}</div>
                    <div style={{ fontSize: 10.5, color: '#7a7670', marginTop: 1 }}>{key.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            )}

            {report.content && (
              <div style={{ fontSize: 12, color: '#5a5650', lineHeight: 1.6, borderTop: '1px solid #edebe7', paddingTop: 10 }}>
                {report.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
