import { useState, useEffect } from 'react'
import type { Project } from '../../api'
import { getProjects, createProject, updateProject, deleteProject } from '../../api'

function getStatusStyle(status: string) {
  switch (status) {
    case 'active': return { color: '#1d4ed8', bg: '#eff6ff', dot: '#3b82f6', label: 'Active' }
    case 'done': return { color: '#15803d', bg: '#dcfce7', dot: '#22c55e', label: 'Done' }
    case 'paused': return { color: '#92400e', bg: '#fffbeb', dot: '#f59e0b', label: 'Paused' }
    case 'planning': return { color: '#6b21a8', bg: '#f3e8ff', dot: '#a855f7', label: 'Planning' }
    default: return { color: '#7a7670', bg: '#f3f2ef', dot: '#a09c94', label: status }
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface NewProjectForm {
  name: string
  description: string
  status: string
  deadline: string
}

const emptyForm: NewProjectForm = { name: '', description: '', status: 'active', deadline: '' }

export default function ProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewProjectForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<NewProjectForm>>({})

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const project = await createProject({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        status: form.status,
        deadline: form.deadline || undefined,
      })
      setProjects(prev => [project, ...prev])
      setForm(emptyForm)
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    const updated = await updateProject(id, { status })
    setProjects(prev => prev.map(p => p.id === id ? updated : p))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return
    await deleteProject(id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  const startEdit = (project: Project) => {
    setEditingId(project.id)
    setEditForm({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      deadline: project.deadline ?? '',
    })
  }

  const saveEdit = async (id: string) => {
    const updated = await updateProject(id, {
      name: editForm.name,
      description: editForm.description ?? undefined,
      status: editForm.status,
      deadline: editForm.deadline ?? undefined,
    })
    setProjects(prev => prev.map(p => p.id === id ? updated : p))
    setEditingId(null)
  }

  const statusOptions = ['planning', 'active', 'paused', 'done']

  if (loading) {
    return <div style={{ fontSize: 12, color: '#a09c94', padding: 4 }}>Loading projects...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 780 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, color: '#a09c94' }}>
          {projects.length === 0 ? 'No projects yet' : `${projects.length} project${projects.length !== 1 ? 's' : ''}`}
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null) }}
          style={{
            background: '#1c1b19', color: '#fff', border: 'none', borderRadius: 7,
            padding: '6px 13px', fontSize: 12, fontWeight: 500, cursor: 'pointer', letterSpacing: '-0.01em'
          }}
        >
          + New Project
        </button>
      </div>

      {/* New project form */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #e5e2db', borderRadius: 10, padding: '16px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1c1b19', marginBottom: 14 }}>New Project</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              autoFocus
              placeholder="Project name *"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') void handleCreate() }}
              style={inputStyle}
            />
            <textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }}
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                style={{ ...inputStyle, flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowForm(false); setForm(emptyForm) }} style={cancelBtnStyle}>Cancel</button>
              <button onClick={() => void handleCreate()} disabled={!form.name.trim() || saving} style={saveBtnStyle(saving || !form.name.trim())}>
                {saving ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects list */}
      {projects.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '32px 20px', color: '#a09c94', fontSize: 12.5 }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📋</div>
          No projects yet. Create one or ask the agent to set one up.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(project => {
            const statusStyle = getStatusStyle(project.status)
            const isEditing = editingId === project.id
            return (
              <div key={project.id} style={{ background: '#fff', border: '1px solid #e5e2db', borderRadius: 10, padding: '14px 16px' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input
                      autoFocus
                      value={editForm.name ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      style={inputStyle}
                    />
                    <textarea
                      value={editForm.description ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      rows={2}
                      style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                    />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <select
                        value={editForm.status ?? 'active'}
                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                        style={{ ...inputStyle, flex: 1 }}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        value={editForm.deadline ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => setEditingId(null)} style={cancelBtnStyle}>Cancel</button>
                      <button onClick={() => void saveEdit(project.id)} style={saveBtnStyle(false)}>Save</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1c1b19', marginBottom: 3 }}>{project.name}</div>
                        {project.description && (
                          <div style={{ fontSize: 12, color: '#5a5650', lineHeight: 1.5 }}>{project.description}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                        <span style={{ background: statusStyle.bg, color: statusStyle.color, borderRadius: 5, padding: '2px 9px', fontSize: 10.5, fontWeight: 600 }}>
                          {statusStyle.label}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {project.deadline && (
                          <div style={{ fontSize: 11, color: '#7a7670', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Due {formatDate(project.deadline)}</span>
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: '#a09c94' }}>Created {formatDate(project.created_at)}</div>
                      </div>

                      <div style={{ display: 'flex', gap: 4 }}>
                        {statusOptions.filter(s => s !== project.status).map(s => (
                          <button
                            key={s}
                            onClick={() => void handleStatusChange(project.id, s)}
                            style={{
                              background: '#f7f6f3', border: '1px solid #e5e2db', borderRadius: 5,
                              padding: '3px 8px', fontSize: 10.5, color: '#7a7670', cursor: 'pointer',
                              fontFamily: 'inherit'
                            }}
                          >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                        <button onClick={() => startEdit(project)} style={{ ...iconBtnStyle }}>Edit</button>
                        <button onClick={() => void handleDelete(project.id)} style={{ ...iconBtnStyle, color: '#dc2626' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', fontSize: 13,
  border: '1px solid #e5e2db', borderRadius: 7, outline: 'none',
  background: '#f7f6f3', color: '#1c1b19', fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const cancelBtnStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e2db', borderRadius: 7,
  padding: '6px 12px', fontSize: 12, color: '#7a7670', cursor: 'pointer', fontFamily: 'inherit'
}

const saveBtnStyle = (disabled: boolean): React.CSSProperties => ({
  background: disabled ? '#6b7280' : '#1c1b19', color: '#fff', border: 'none', borderRadius: 7,
  padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit'
})

const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: '1px solid #e5e2db', borderRadius: 5,
  padding: '3px 8px', fontSize: 10.5, color: '#7a7670', cursor: 'pointer', fontFamily: 'inherit'
}
