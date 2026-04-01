import { StrictMode, createContext, useContext, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import './index.css'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AdminPage from './pages/AdminPage'
import SellerDashboardPage from './pages/SellerDashboardPage'
import StoreSettingsPage from './pages/StoreSettingsPage'
import CreateProductPage from './pages/CreateProductPage'
import ManageProductsPage from './pages/ManageProductsPage'
import EditProductPage from './pages/EditProductPage'
import ExplorePage from './pages/ExplorePage'
import ProductDetailPage from './pages/ProductDetailPage'
import { AuthProvider, useAuth } from './auth/AuthContext'

// Global search context
type SearchContextType = {
  searchQuery: string
  setSearchQuery: (q: string) => void
}
const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) throw new Error('useSearch must be used within SearchProvider')
  return context
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SearchProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </SearchProvider>
    </AuthProvider>
  </StrictMode>,
)

function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('')
  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchContext.Provider>
  )
}

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
              <Link to="/explore" className="btn-primary btn-large">Explore Marketplace</Link>
              <Link to="/register" className="btn-secondary btn-large">Start Selling Now</Link>
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

function GlobalSearchBar() {
  const { searchQuery, setSearchQuery } = useSearch()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (location.pathname !== '/explore' && e.target.value.trim() !== '') {
      navigate('/explore')
    }
  }

  return (
    <div className="nav-search-container" style={{ flex: 1, maxWidth: '600px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search products..."
          style={{
            width: '100%',
            borderRadius: '99px',
            padding: '0.5rem 1rem 0.5rem 2.5rem',
            background: 'rgba(0,0,0,0.3)',
            height: '40px',
            border: '1px solid var(--border)'
          }}
          value={searchQuery}
          onChange={handleSearch}
        />
        <svg
          style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'var(--text-muted)' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  )
}

function AppShell() {
  const { user } = useAuth()
  return (
    <>
      <header className="navbar">
        <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
          <Link to="/" className="logo" style={{ flexShrink: 0 }}>
            SellorHub
          </Link>

          <Link
            to="/explore"
            className="nav-link"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.95rem',
              fontWeight: '600',
              color: 'var(--text)',
              whiteSpace: 'nowrap'
            }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            Explore
          </Link>

          <GlobalSearchBar />
        </div>

        <nav className="nav-links" style={{ flexShrink: 0, marginLeft: '1.5rem' }}>
          {user ? (
            <>
              <Link
                to={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/me'}
                className="nav-link"
              >
                {user.role === 'admin' ? 'Admin' : user.role === 'seller' ? 'My Store' : 'Dashboard'}
              </Link>
              <LogoutButton />
              <div className="user-badge" style={{ display: 'none' /* mobile? */ }}>
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
          <Route path="/store-settings" element={<StoreSettingsPage />} />
          <Route path="/products" element={<ManageProductsPage />} />
          <Route path="/products/new" element={<CreateProductPage />} />
          <Route path="/products/:id/edit" element={<EditProductPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
        </Routes>
      </main>
    </>
  )
}
