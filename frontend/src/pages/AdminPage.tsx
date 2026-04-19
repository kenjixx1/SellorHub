import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { adminService } from '../lib/services/adminService'
import '../css/AdminPage.css'
import type { AdminStats, AdminUser, GetUsersFilters, AdminProduct } from '../lib/services/adminService'



function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        minWidth: 120,
      }}
    >
      <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    </div>
  )
}



function SectionHeading({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: '1.125rem',
        fontWeight: 700,
        marginBottom: '1rem',
        marginTop: 0,
        color: 'var(--text)',
      }}
    >
      {title}
    </h2>
  )
}



function SectionError({ msg }: { msg: string }) {
  return (
    <div
      style={{
        color: '#fca5a5',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
      }}
    >
      {msg}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{text}</p>
  )
}



function AdminDropdown<T extends string>({ 
  value, 
  options, 
  onChange, 
  placeholder 
}: { 
  value: T | '', 
  options: { value: T | '', label: string }[], 
  onChange: (val: T | '') => void,
  placeholder: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const currentLabel = options.find(o => o.value === value)?.label || placeholder

  return (
    <div style={{ position: 'relative', zIndex: 20 }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.5rem 1rem', background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border)', borderRadius: '0.75rem',
          color: 'var(--text)', fontSize: '0.875rem', fontWeight: 500,
          cursor: 'pointer', minWidth: '140px', justifyContent: 'space-between',
          transition: 'all 0.2s'
        }}
      >
        <span>{currentLabel}</span>
        <svg 
          style={{ width: '0.8rem', height: '0.8rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} 
            onClick={() => setIsOpen(false)} 
          />
          <div 
            className="custom-dropdown-content"
            style={{
              position: 'absolute', top: 'calc(100% + 0.5rem)', left: 0, width: '100%',
              background: 'rgba(15, 23, 42, 0.98)', backdropFilter: 'blur(16px)',
              border: '1px solid var(--border)', borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', zIndex: 101, padding: '0.35rem'
            }}
          >
            {options.map(opt => (
              <button
                key={opt.label}
                className="dropdown-option"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                  border: 'none', background: value === opt.value ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: value === opt.value ? 'var(--primary)' : 'var(--text)', fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}



export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth()


  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)


  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersError, setUsersError] = useState<string | null>(null)
  const [usersLoading, setUsersLoading] = useState(false)
  const [roleFilter, setRoleFilter] = useState<GetUsersFilters['role'] | ''>('')
  const [search, setSearch] = useState('')


  const [pendingSellers, setPendingSellers] = useState<AdminUser[]>([])
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [pendingLoading, setPendingLoading] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState<number | null>(null)
  const [approvalMsg, setApprovalMsg] = useState<string | null>(null)


  const [products, setProducts] = useState<AdminProduct[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productStatusFilter, setProductStatusFilter] = useState<string>('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const activeToken = token ?? ''


  const fetchStats = async () => {
    try {
      const data = await adminService.getStats(activeToken)
      setStats(data)
      setStatsError(null)
    } catch (err: any) {
      setStatsError(err?.message ?? 'Failed to load stats')
    }
  }


  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const filters: GetUsersFilters = {}
      if (roleFilter) filters.role = roleFilter
      if (search.trim()) filters.search = search.trim()
      const data = await adminService.getUsers(activeToken, filters)
      setUsers(data)
      setUsersError(null)
    } catch (err: any) {
      setUsersError(err?.message ?? 'Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }


  const fetchPending = async () => {
    setPendingLoading(true)
    try {
      const data = await adminService.getPendingSellers(activeToken)
      setPendingSellers(data)
      setPendingError(null)
    } catch (err: any) {
      setPendingError(err?.message ?? 'Failed to load pending sellers')
    } finally {
      setPendingLoading(false)
    }
  }


  const fetchProducts = async () => {
    setProductsLoading(true)
    try {
      const data = await adminService.getProducts(activeToken, productStatusFilter || undefined)
      setProducts(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setProductsLoading(false)
    }
  }


  useEffect(() => {
    if (!activeToken || !user || user.role !== 'admin') return
    fetchStats()
    fetchUsers()
    fetchPending()
    fetchProducts()

  }, [activeToken, user])


  const handleApproval = async (userId: number, approve: boolean) => {
    setApprovalLoading(userId)
    setApprovalMsg(null)
    try {
      await adminService.approveSeller(activeToken, userId, approve)
      setApprovalMsg(approve ? 'Seller approved.' : 'Seller rejected.')
      await Promise.all([fetchPending(), fetchStats(), fetchUsers()])
    } catch (err: any) {
      setApprovalMsg(err?.message ?? 'Action failed')
    } finally {
      setApprovalLoading(null)
    }
  }

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete user "${username}"? This action cannot be undone.`)) return
    setActionLoading(`delete-${userId}`)
    try {
      await adminService.deleteUser(activeToken, userId)
      setApprovalMsg(`User ${username} deleted.`)
      fetchUsers()
      fetchStats()
    } catch (err: any) {
      setApprovalMsg(err?.message ?? 'Failed to delete user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleProductHide = async (productId: number, hide: boolean) => {
    setActionLoading(`hide-${productId}`)
    try {
      if (hide) await adminService.hideProduct(activeToken, productId)
      else await adminService.unhideProduct(activeToken, productId)
      fetchProducts()
    } catch (err: any) {
      alert(err?.message ?? 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }

  if (authLoading) {
    return <div className="page-container">Loading…</div>
  }
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const divider: React.CSSProperties = {
    borderTop: '1px solid var(--border)',
    paddingTop: '2rem',
    marginTop: '2rem',
  }

  return (
    <div
      className="page-container"
      style={{ maxWidth: 900 }}
    >
      {}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Admin Dashboard</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Logged in as <strong style={{ color: 'var(--text)' }}>{user.username}</strong>
        </span>
      </div>

      {}
      <section>
        <SectionHeading title="Platform overview" />
        {statsError ? (
          <SectionError msg={statsError} />
        ) : !stats ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading stats…</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <StatCard label="Total users" value={stats.users.total} />
            <StatCard label="Buyers" value={stats.users.buyers} />
            <StatCard label="Sellers" value={stats.users.sellers} />
            <StatCard label="Pending approvals" value={stats.users.pending_seller_approvals} />
            <StatCard label="Stores" value={stats.stores.total} />
            <StatCard label="Products" value={stats.products.total} />
            <StatCard label="Active products" value={stats.products.active} />
            <StatCard label="Inquiries (today)" value={`${stats.inquiries.today} / ${stats.inquiries.total}`} />
          </div>
        )}
      </section>

      {}
      <section style={divider}>
        <SectionHeading title="Pending seller approvals" />
        {approvalMsg && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.6rem 1rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.25)',
              color: 'var(--text)',
            }}
          >
            {approvalMsg}
          </div>
        )}
        {pendingError ? (
          <SectionError msg={pendingError} />
        ) : pendingLoading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>
        ) : pendingSellers.length === 0 ? (
          <EmptyState text="No sellers awaiting approval." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {pendingSellers.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{s.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.email}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-primary"
                    disabled={approvalLoading === s.id}
                    onClick={() => handleApproval(s.id, true)}
                  >
                    {approvalLoading === s.id ? '…' : 'Approve'}
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={approvalLoading === s.id}
                    onClick={() => handleApproval(s.id, false)}
                  >
                    {approvalLoading === s.id ? '…' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {}
      <section style={divider}>
        <SectionHeading title="All users" />

        {}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <AdminDropdown
            value={roleFilter || ''}
            onChange={(val) => setRoleFilter(val as GetUsersFilters['role'] | '')}
            options={[
              { value: '', label: 'All roles' },
              { value: 'buyer', label: 'Buyer' },
              { value: 'seller', label: 'Seller' },
              { value: 'admin', label: 'Admin' }
            ]}
            placeholder="Role"
          />
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 180, height: '38px', borderRadius: '0.75rem' }}
            placeholder="Search by username or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-secondary" style={{ height: '38px' }} onClick={fetchUsers} disabled={usersLoading}>
            {usersLoading ? 'Loading…' : 'Search'}
          </button>
        </div>

        {usersError ? (
          <SectionError msg={usersError} />
        ) : users.length === 0 ? (
          <EmptyState text={usersLoading ? 'Loading…' : 'No users found.'} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.875rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Username', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  >
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{u.id}</td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{u.username}</td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.5rem',
                          borderRadius: 9999,
                          background:
                            u.role === 'admin'
                              ? 'rgba(99,102,241,0.2)'
                              : u.role === 'seller'
                              ? 'rgba(52,211,153,0.15)'
                              : 'rgba(148,163,184,0.1)',
                          color:
                            u.role === 'admin'
                              ? '#818cf8'
                              : u.role === 'seller'
                              ? '#6ee7b7'
                              : 'var(--text-muted)',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                      {u.role === 'seller' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                          <span>{u.selling_approve ? '✓' : '—'}</span>
                          {u.selling_approve && (
                            <button 
                              onClick={() => handleApproval(u.id, false)}
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                              className="btn-secondary"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ) : ''}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          disabled={actionLoading === `delete-${u.id}`}
                          style={{
                            padding: '0.4rem',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '0.4rem',
                            color: '#fca5a5',
                            cursor: 'pointer'
                          }}
                          title="Delete User"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {}
      <section style={divider}>
        <SectionHeading title="Product Moderation" />
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <AdminDropdown
            value={productStatusFilter || ''}
            onChange={(val) => { setProductStatusFilter(val); fetchProducts(); }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'hidden', label: 'Hidden' },
              { value: 'sold', label: 'Sold' },
            ]}
            placeholder="Status"
          />
          <button className="btn-secondary" style={{ height: '38px' }} onClick={fetchProducts}>Refresh</button>
        </div>

        {productsLoading ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading products…</p> : products.length === 0 ? <EmptyState text="No products found." /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['ID', 'Product', 'Price', 'Status', 'Actions'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{p.id}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>{p.title}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>฿{p.price.toLocaleString()}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{
                        fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: 99,
                        background: p.status === 'active' ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                        color: p.status === 'active' ? '#6ee7b7' : '#fca5a5'
                      }}>{p.status}</span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <button
                        className={p.status === 'hidden' ? "btn-primary" : "btn-secondary"}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        disabled={actionLoading === `hide-${p.id}`}
                        onClick={() => handleToggleProductHide(p.id, p.status !== 'hidden')}
                      >
                        {p.status === 'hidden' ? 'Unhide' : 'Hide'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
