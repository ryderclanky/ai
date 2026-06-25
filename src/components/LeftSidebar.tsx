import type { Task, ActionLog } from '../api'

interface LeftSidebarProps {
  tasks: Task[]
  logs: ActionLog[]
}

function getTaskStyle(status: string) {
  switch (status) {
    case 'done': return { color: '#22c55e', bg: '#dcfce7', border: '#22c55e' }
    case 'in_progress': return { color: '#3b82f6', bg: '#eff6ff', border: '#3b82f6' }
    case 'waiting': return { color: '#d97706', bg: '#fffbeb', border: '#f59e0b' }
    default: return { color: '#c4c0b9', bg: '#f7f6f3', border: '#d8d5cf' }
  }
}

function getTaskNote(task: Task) {
  if (task.note) return task.note
  switch (task.status) {
    case 'done': return 'Completed'
    case 'in_progress': return 'In progress'
    case 'waiting': return 'Awaiting approval'
    default: return 'Not started'
  }
}

function TaskDot({ status }: { status: string }) {
  const style = getTaskStyle(status)
  const size = 15
  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%',
    background: style.bg, border: `1.5px solid ${style.border}`,
    flexShrink: 0, marginTop: 0.5,
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }

  if (status === 'done') {
    return (
      <div style={base}>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path d="M1.5 4L3.5 6L6.5 2.5" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  if (status === 'todo') {
    return <div style={{ ...base, background: '#f7f6f3', border: '1.5px solid #d8d5cf' }} />
  }
  return (
    <div style={base}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: style.color }} />
    </div>
  )
}

export default function LeftSidebar({ tasks, logs }: LeftSidebarProps) {
  const doneCount = tasks.filter(t => t.status === 'done').length
  const pendingCount = tasks.filter(t => t.status !== 'done').length

  return (
    <aside style={{
      width: 214, flexShrink: 0, background: '#fff',
      borderRight: '1px solid #e5e2db', overflowY: 'auto',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Business Goal */}
      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 7 }}>
          Business Goal
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: '#1c1b19', lineHeight: 1.45 }}>
          Grow catering clients by 20% this quarter
        </div>
        <div style={{ marginTop: 9, height: 3, background: '#edebe7', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: '34%', height: '100%', background: '#2563eb', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 10.5, color: '#a09c94', marginTop: 4 }}>34% · 6 weeks remaining</div>
      </div>
      <div style={{ height: 1, background: '#edebe7', margin: '0 14px' }} />

      {/* Active Project */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 7 }}>
          Active Project
        </div>
        <div style={{ background: '#f7f6f3', border: '1px solid #e5e2db', borderRadius: 7, padding: '9px 10px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: '#1c1b19' }}>Local Restaurant Outreach</div>
          <div style={{ fontSize: 11, color: '#7a7670', marginTop: 2 }}>{tasks.length} tasks · {pendingCount} pending</div>
        </div>
      </div>

      {/* Today's Focus */}
      <div style={{ padding: '0 14px 12px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 6 }}>
          Today's Focus
        </div>
        <div style={{ fontSize: 12, color: '#1c1b19', lineHeight: 1.5 }}>
          Review restaurant leads and approve outreach emails before noon.
        </div>
      </div>
      <div style={{ height: 1, background: '#edebe7', margin: '0 14px' }} />

      {/* Tasks */}
      <div style={{ padding: '12px 14px', flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 8 }}>
          Tasks
        </div>
        {tasks.length === 0 ? (
          <div style={{ fontSize: 12, color: '#a09c94', fontStyle: 'italic' }}>No tasks yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tasks.map(task => {
              const style = getTaskStyle(task.status)
              return (
                <div key={task.id} style={{ display: 'flex', gap: 8, padding: '5px 0', alignItems: 'flex-start' }}>
                  <TaskDot status={task.status} />
                  <div>
                    <div style={{ fontSize: 12, color: task.status === 'todo' ? '#a09c94' : '#1c1b19', lineHeight: 1.35 }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 10.5, color: style.color, marginTop: 1 }}>{getTaskNote(task)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div style={{ height: 1, background: '#edebe7', margin: '0 14px' }} />

      {/* Health Check */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 8 }}>
          Health Check
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Tasks done', value: String(doneCount), color: '#1c1b19' },
            { label: 'Tasks pending', value: String(pendingCount), color: '#1c1b19' },
            { label: 'Actions logged', value: String(logs.length), color: '#1c1b19' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: '#7a7670' }}>{item.label}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
