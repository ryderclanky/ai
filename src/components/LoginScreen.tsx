import { useState } from 'react'

interface LoginScreenProps {
  onLogin: () => void
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (username === 'admin' && password === 'admin') {
        onLogin()
      } else {
        setError('Invalid username or password')
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f3f2ef', fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{ width: 360 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, background: '#1c1b19', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="4.5" r="2.2" fill="#fff" />
              <path d="M2.5 12.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.03em', color: '#1c1b19' }}>
            Employee Agent
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 12, border: '1px solid #e5e2db',
          padding: '32px 32px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1c1b19', marginBottom: 4, letterSpacing: '-0.02em' }}>
              Sign in
            </div>
            <div style={{ fontSize: 12.5, color: '#7a7670' }}>
              Enter your credentials to access your agent workspace
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#1c1b19', display: 'block', marginBottom: 5 }}>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  style={{
                    width: '100%', padding: '9px 12px', fontSize: 13.5,
                    border: `1px solid ${error ? '#fca5a5' : '#e5e2db'}`,
                    borderRadius: 8, outline: 'none', background: '#f7f6f3',
                    color: '#1c1b19', boxSizing: 'border-box',
                    transition: 'border-color 0.15s'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#1c1b19'; e.target.style.background = '#fff' }}
                  onBlur={e => { e.target.style.borderColor = error ? '#fca5a5' : '#e5e2db'; e.target.style.background = '#f7f6f3' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#1c1b19', display: 'block', marginBottom: 5 }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  style={{
                    width: '100%', padding: '9px 12px', fontSize: 13.5,
                    border: `1px solid ${error ? '#fca5a5' : '#e5e2db'}`,
                    borderRadius: 8, outline: 'none', background: '#f7f6f3',
                    color: '#1c1b19', boxSizing: 'border-box',
                    transition: 'border-color 0.15s'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#1c1b19'; e.target.style.background = '#fff' }}
                  onBlur={e => { e.target.style.borderColor = error ? '#fca5a5' : '#e5e2db'; e.target.style.background = '#f7f6f3' }}
                />
              </div>

              {error && (
                <div style={{
                  fontSize: 12, color: '#dc2626', background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: 7, padding: '8px 12px'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username || !password}
                style={{
                  width: '100%', padding: '10px', fontSize: 13.5, fontWeight: 500,
                  background: loading || !username || !password ? '#6b7280' : '#1c1b19',
                  color: '#fff', border: 'none', borderRadius: 8,
                  cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
                  letterSpacing: '-0.01em', marginTop: 4,
                  transition: 'background 0.15s'
                }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11.5, color: '#a09c94' }}>
          Your AI employee is ready to work
        </div>
      </div>
    </div>
  )
}
