import { StrictMode, createContext, useContext, useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from './lib/api'
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
import SellerOrdersPage from './pages/SellerOrdersPage'
import ExplorePage from './pages/ExplorePage'
import ProductDetailPage from './pages/ProductDetailPage'
import ProfilePage from './pages/ProfilePage'
import PublicStorePage from './pages/PublicStorePage'
import StoresPage from './pages/StoresPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import OrdersPage from './pages/OrdersPage'
import ManageCategoriesPage from './pages/ManageCategoriesPage'
import { AuthProvider, useAuth } from './auth/AuthContext'

// Global search context
type SearchContextType = {
  searchQuery: string
  setSearchQuery: (q: string) => void
  sortBy: string
  setSortBy: (s: string) => void
  minPrice: string
  setMinPrice: (p: string) => void
  maxPrice: string
  setMaxPrice: (p: string) => void
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
  const [sortBy, setSortBy] = useState('newest')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  return (
    <SearchContext.Provider value={{ 
      searchQuery, setSearchQuery,
      sortBy, setSortBy,
      minPrice, setMinPrice,
      maxPrice, setMaxPrice
    }}>
      {children}
    </SearchContext.Provider>
  )
}

function HomePage() {
  const { user } = useAuth()

  return (
    <div className="hero" style={{ justifyContent: 'center', textAlign: 'center', flexDirection: 'column' }}>
      <div className="hero-content" style={{ margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: '4.5rem', marginBottom: '1.5rem' }}>Transform Your Sales Journey with <br /><span>SellorHub</span></h1>
        <p style={{ maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
          The ultimate platform to manage, showcase, and skyrocket your sales. Join thousands of top sellers today.
        </p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          {user ? (
            user.role !== 'buyer' && (
              <Link
                to={user.role === 'admin' ? '/admin' : '/seller'}
                className="btn-primary btn-large"
              >
                {user.role === 'admin' ? 'Admin Dashboard' : 'Seller Dashboard'}
              </Link>
            )
          ) : (
            <>
              <Link to="/explore" className="btn-primary btn-large">Explore Marketplace</Link>
              <Link to="/register" className="btn-secondary btn-large">Start Selling Now</Link>
            </>
          )}
        </div>
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

function ProfileDropdown() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  if (!user) return null

  return (
    <div className="profile-dropdown-container">
      <div className="user-avatar" onClick={() => setIsOpen(!isOpen)}>
        {user.avatar_url ? (
          <img
            src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE_URL}${user.avatar_url}`}
            alt={user.username}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          user.username.charAt(0).toUpperCase()
        )}
      </div>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
            onClick={() => setIsOpen(false)}
          />
          <div className="profile-dropdown">
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{user.username}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>

            <button
              className="dropdown-item"
              onClick={() => { navigate('/profile'); setIsOpen(false); }}
            >
              <svg style={{ width: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </button>

            <button
              className="dropdown-item"
              onClick={() => { navigate('/orders'); setIsOpen(false); }}
            >
              <svg style={{ width: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              My Order
            </button>

            {user.role !== 'buyer' && (
              <button
                className="dropdown-item"
                onClick={() => { navigate(user.role === 'admin' ? '/admin' : '/seller'); setIsOpen(false); }}
              >
                <svg style={{ width: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {user.role === 'admin' ? 'Admin' : 'My Store'}
              </button>
            )}

            <div className="dropdown-divider" />

            <button className="dropdown-item logout" onClick={logout}>
              <svg style={{ width: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function GlobalSearchBar() {
  const { 
    searchQuery, setSearchQuery, 
    sortBy, setSortBy,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice
  } = useSearch()
  
  const navigate = useNavigate()
  const location = useLocation()
  const [showPriceFilter, setShowPriceFilter] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShowPriceFilter(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowPriceFilter(false)
    }, 400) // 400ms delay to allow crossing the gap
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (location.pathname !== '/explore' && e.target.value.trim() !== '') {
      navigate('/explore')
    }
  }

  const handleFilterChange = () => {
    if (location.pathname !== '/explore') {
      navigate('/explore')
    }
  }

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value)
    handleFilterChange()
  }

  const handleMinPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinPrice(e.target.value)
    handleFilterChange()
  }

  const handleMaxPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxPrice(e.target.value)
    handleFilterChange()
  }

  return (
    <div className="nav-search-container" style={{ flex: 1, maxWidth: '850px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <div style={{ position: 'relative', flex: 1 }}>
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
      
      <select 
        className="form-input" 
        value={sortBy} 
        onChange={handleSortChange}
        style={{ 
          width: '130px', 
          height: '40px', 
          borderRadius: '99px',
          padding: '0 2rem 0 1rem', 
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          fontSize: '0.85rem'
        }}
      >
        <option value="newest">Newest</option>
        <option value="popular">Popular</option>
        <option value="price_asc">Price L-H</option>
        <option value="price_desc">Price H-L</option>
      </select>

      <div 
        className="nav-profile dropdown" 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'relative' }}
      >
        <button 
          className="form-input dropdown-trigger" 
          style={{ 
            height: '40px', 
            borderRadius: '99px',
            padding: '0 1rem', 
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <svg style={{ width: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Price Range
        </button>

        {showPriceFilter && (
          <div className="dropdown-menu" style={{ 
            position: 'absolute',
            zIndex: 50,
            left: '50%', 
            transform: 'translateX(-50%)',
            top: 'calc(100% + 0.5rem)', 
            width: '260px', 
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
          }}>
            <input 
              type="number" 
              className="form-input" 
              placeholder="Min ฿" 
              value={minPrice} 
              onChange={handleMinPrice}
              min="0"
              style={{ width: '100px' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>-</span>
            <input 
              type="number" 
              className="form-input" 
              placeholder="Max ฿" 
              value={maxPrice} 
              onChange={handleMaxPrice}
              min="0"
              style={{ width: '100px' }}
            />
          </div>
        )}
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

          <Link
            to="/stores"
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Stores
          </Link>

          <GlobalSearchBar />
        </div>

        <nav className="nav-links" style={{ flexShrink: 0, marginLeft: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {user && (
            <Link to="/cart" style={{ display: 'flex', alignItems: 'center', color: 'var(--text)', textDecoration: 'none' }}>
              <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>
          )}

          {user ? (
            <ProfileDropdown />
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
          <Route path="/seller/orders" element={<SellerOrdersPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/store/:slug" element={<PublicStorePage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/categories" element={<ManageCategoriesPage />} />
        </Routes>
      </main>
    </>
  )
}
