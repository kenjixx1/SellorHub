import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './index.css'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import SellerDashboardPage from './pages/SellerDashboardPage'
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

function HomePage() {
  const { user } = useAuth();
  return (
    <div className="hero">
      <div className="hero-content">
        <h1>Transform Your Sales Journey with <span>SellorHub</span></h1>
        <p>
          The ultimate platform to manage, showcase, and skyrocket your sales. Join thousands of top sellers today.
        </p>
        <div className="hero-actions">
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/me'}
              className="btn-primary btn-large"
            >
              {user.role === 'admin' ? 'Admin Dashboard' : user.role === 'seller' ? 'Seller Dashboard' : 'Go to Dashboard'}
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary btn-large">Start Selling Now</Link>
              <Link to="/login" className="btn-secondary btn-large">Log In</Link>
            </>
          )}
        </div>
      </div>
      <div className="hero-graphics">
        <div className="glass-card float-1">📦 Manage Inventory</div>
        <div className="glass-card float-2">📈 Track Sales</div>
        <div className="glass-card float-3">🤝 Connect with Buyers</div>
      </div>
    </div>
  )
}

function MePage() {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-container">Loading…</div>
  if (!user) return <div className="page-container">Not logged in.</div>
  return (
    <div className="page-container">
      <h1>Dashboard</h1>
      <div style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>Welcome back, {user.username}!</div>
      <pre style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem', overflowX: 'auto', border: '1px solid var(--border)' }}>
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  )
}

function LogoutButton() {
  const { logout } = useAuth()
  return (
    <button onClick={logout} className="btn-logout">
      Logout
    </button>
  )
}

function AppShell() {
  const { user } = useAuth()
  return (
    <>
      <header className="navbar">
        <Link to="/" className="logo">
          SellorHub
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/me'}
                className="nav-link"
              >
                {user.role === 'admin' ? 'Admin' : user.role === 'seller' ? 'My Store' : 'Dashboard'}
              </Link>
              <LogoutButton />
              <div className="user-badge">
                <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
                {user.username}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Log In</Link>
              <Link to="/register" className="btn-primary">Get Started</Link>
            </>
          )}
        </nav>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/seller" element={<SellerDashboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </>
  )
}
