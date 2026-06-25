import { useState, useEffect } from 'react'
import Header from './components/Header'
import LeftSidebar from './components/LeftSidebar'
import ChatPanel from './components/ChatPanel'
import RightPanel from './components/RightPanel'
import BottomTabs from './components/BottomTabs'
import LoginScreen from './components/LoginScreen'
import { getState, connectWebSocket, approveAction, rejectAction } from './api'
import type { AppState } from './api'

export type TabId = 'leads' | 'memory' | 'reports' | 'improvements' | 'playbooks' | 'projects'

const emptyState: AppState = {
  tasks: [],
  approvals: [],
  logs: [],
  memories: [],
  leads: [],
  reports: [],
  playbooks: [],
}

function Workspace() {
  const [state, setState] = useState<AppState>(emptyState)
  const [activeTab, setActiveTab] = useState<TabId>('projects')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getState()
      .then(s => { setState(s); setLoading(false) })
      .catch(() => setLoading(false))

    const disconnect = connectWebSocket((newState) => setState(newState))
    return disconnect
  }, [])

  const pendingApprovals = state.approvals.filter(a => a.status === 'pending')

  const handleApprove = async (id: string) => {
    await approveAction(id)
    setState(prev => ({
      ...prev,
      approvals: prev.approvals.map(a => a.id === id ? { ...a, status: 'approved' } : a)
    }))
  }

  const handleReject = async (id: string) => {
    await rejectAction(id)
    setState(prev => ({
      ...prev,
      approvals: prev.approvals.map(a => a.id === id ? { ...a, status: 'rejected' } : a)
    }))
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f2ef' }}>
        <div style={{ fontSize: 14, color: '#7a7670' }}>Loading Employee Agent...</div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header pendingCount={pendingApprovals.length} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <LeftSidebar tasks={state.tasks} logs={state.logs} memories={state.memories} />
        <ChatPanel onStateChange={(newState) => setState(newState)} />
        <RightPanel
          approvals={pendingApprovals}
          logs={state.logs}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      </div>
      <BottomTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        state={state}
      />
    </div>
  )
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />
  }

  return <Workspace />
}
