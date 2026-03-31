import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './index.css'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { AuthProvider, useAuth } from './auth/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)

function MePage() {
  const { user, loading, logout } = useAuth()
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>
  if (!user) return <div style={{ padding: 16 }}>Not logged in.</div>
  return (
    <div style={{ maxWidth: 720, margin: '32px auto', padding: 16 }}>
      <h1>Me</h1>
      <pre style={{ padding: 12, background: 'rgba(0,0,0,0.06)', overflowX: 'auto' }}>
        {JSON.stringify(user, null, 2)}
      </pre>
      <button onClick={logout} style={{ padding: 10, fontWeight: 600 }}>
        Logout
      </button>
    </div>
  )
}

function AppShell() {
  const { user } = useAuth()
  return (
    <>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          padding: 12,
          borderBottom: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <Link to="/" style={{ fontWeight: 700, textDecoration: 'none' }}>
          SellorHub
        </Link>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/login">Login</Link>
          <Link to="/register"> Register </Link>
          <Link to="/me">Me</Link>
          <span style={{ opacity: 0.7 }}>{user ? `Signed in as ${user.username}` : 'Guest'}</span>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<div style={{ padding: 16 }}>Home (placeholder)</div>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/me" element={<MePage />} />
      </Routes>
    </>
  )
}
