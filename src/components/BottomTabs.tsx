import type { TabId } from '../App'
import type { AppState } from '../api'
import LeadsTab from './tabs/LeadsTab'
import MemoryTab from './tabs/MemoryTab'
import ReportsTab from './tabs/ReportsTab'
import ImprovementsTab from './tabs/ImprovementsTab'
import PlaybooksTab from './tabs/PlaybooksTab'

interface BottomTabsProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  state: AppState
}

export default function BottomTabs({ activeTab, onTabChange, state }: BottomTabsProps) {
  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: 'leads', label: 'Leads', badge: state.leads.length || undefined },
    { id: 'memory', label: 'Memory' },
    { id: 'reports', label: 'Reports' },
    { id: 'improvements', label: 'Improvements' },
    { id: 'playbooks', label: 'Playbooks' },
  ]

  return (
    <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #e5e2db', display: 'flex', flexDirection: 'column', height: 272 }}>
      <div style={{ display: 'flex', padding: '0 20px', borderBottom: '1px solid #edebe7', flexShrink: 0, overflowX: 'auto' }}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                padding: '9px 14px', fontSize: 12.5,
                fontWeight: isActive ? 600 : 400,
                fontFamily: "'DM Sans', sans-serif",
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${isActive ? '#1c1b19' : 'transparent'}`,
                color: isActive ? '#1c1b19' : '#9b9690',
                cursor: 'pointer', marginBottom: -1,
                display: 'flex', alignItems: 'center', gap: 5,
                whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              {tab.label}
              {tab.badge != null && (
                <span style={{
                  background: '#f3f2ef', border: '1px solid #e5e2db',
                  borderRadius: 10, padding: '0px 6px',
                  fontSize: 10, fontWeight: 600, color: '#7a7670', lineHeight: '16px'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px 20px' }}>
        {activeTab === 'leads' && <LeadsTab leads={state.leads} />}
        {activeTab === 'memory' && <MemoryTab memories={state.memories} />}
        {activeTab === 'reports' && <ReportsTab reports={state.reports} />}
        {activeTab === 'improvements' && <ImprovementsTab />}
        {activeTab === 'playbooks' && <PlaybooksTab playbooks={state.playbooks} />}
      </div>
    </div>
  )
}
