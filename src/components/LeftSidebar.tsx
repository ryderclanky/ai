import { useState, useEffect } from 'react'
import type { Task, ActionLog, Memory } from '../api'

interface LeftSidebarProps {
  tasks: Task[]
  logs: ActionLog[]
  memories: Memory[]
}

function getTaskStyle(status: string) {
  switch (status) {
    case 'done': return { color: '#22c55e', bg: '#dcfce7', border: '#22c55e' }
    case 'in_progress': return { color: '#3b82f6', bg: '#eff6ff', border: '#3b82f6' }
    case 'waiting': return { color: '#d97706', bg: '#fffbeb', border: '#f59e0b' }
    default: return { color: '#c4c0b9', bg: '#f7f6f3', border: '#d8d5cf' }
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

export default function LeftSidebar({ tasks, logs, memories }: LeftSidebarProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const doneCount = tasks.filter(t => t.status === 'done').length
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length
  const pendingCount = tasks.filter(t => t.status !== 'done').length

  const businessGoal = memories.find(m => m.category === 'business_goal')

  const recentTasks = tasks.slice(0, 6)

  return (
    <aside style={{
      width: 214, flexShrink: 0, background: '#fff',
      borderRight: '1px solid #e5e2db', overflowY: 'auto',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Date & time */}
      <div style={{ padding: '14px 14px 10px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 4 }}>
          {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#1c1b19', letterSpacing: '-0.02em', fontFamily: "'DM Mono', monospace" }}>
          {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
        <div style={{ fontSize: 11, color: '#a09c94', marginTop: 2 }}>
          {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
      <div style={{ height: 1, background: '#edebe7', margin: '0 14px' }} />

      {/* Business Goal */}
      {businessGoal ? (
        <>
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94', marginBottom: 6 }}>
              Business Goal
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: '#1c1b19', lineHeight: 1.45 }}>
              {businessGoal.content}
            </div>
          </div>
          <div style={{ height: 1, background: '#edebe7', margin: '0 14px' }} />
        </>
      ) : null}

      {/* Tasks */}
      <div style={{ padding: '12px 14px', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#a09c94' }}>
            Tasks
          </div>
          {tasks.length > 0 && (
            <div style={{ fontSize: 10, color: '#a09c94' }}>
              {doneCount}/{tasks.length}
            </div>
          )}
        </div>

        {tasks.length === 0 ? (
          <div style={{ fontSize: 11.5, color: '#a09c94', fontStyle: 'italic', lineHeight: 1.5 }}>
            No tasks yet. Ask the agent to create tasks for your projects.
          </div>
        ) : (
          <>
            {inProgressCount > 0 && (
              <div style={{ marginBottom: 6, padding: '5px 8px', background: '#eff6ff', borderRadius: 6, fontSize: 11, color: '#1d4ed8', fontWeight: 500 }}>
                {inProgressCount} in progress
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentTasks.map(task => {
                const style = getTaskStyle(task.status)
                return (
                  <div key={task.id} style={{ display: 'flex', gap: 8, padding: '5px 0', alignItems: 'flex-start' }}>
                    <TaskDot status={task.status} />
                    <div>
                      <div style={{ fontSize: 12, color: task.status === 'todo' ? '#a09c94' : '#1c1b19', lineHeight: 1.35 }}>
                        {task.title}
                      </div>
                      {task.note && (
                        <div style={{ fontSize: 10.5, color: style.color, marginTop: 1 }}>{task.note}</div>
                      )}
                    </div>
                  </div>
                )
              })}
              {tasks.length > 6 && (
                <div style={{ fontSize: 11, color: '#a09c94', paddingLeft: 23, marginTop: 2 }}>
                  +{tasks.length - 6} more
                </div>
              )}
            </div>
          </>
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
            { label: 'Tasks done', value: String(doneCount) },
            { label: 'Tasks pending', value: String(pendingCount) },
            { label: 'Actions logged', value: String(logs.length) },
            { label: 'Memories stored', value: String(memories.length) },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, color: '#7a7670' }}>{item.label}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#1c1b19' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
