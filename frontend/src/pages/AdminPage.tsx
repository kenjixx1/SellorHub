import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getAdminStats,
  getAdminUsers,
  getPendingSellers,
  approveSeller,
} from '../lib/admin'
import type { AdminStats, AdminUser, GetUsersFilters } from '../lib/admin'

// ── Stat card ────────────────────────────────────────────────────────────────

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

// ── Section heading ──────────────────────────────────────────────────────────

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

// ── Inline error/empty helpers ────────────────────────────────────────────────

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

// ── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, token, loading: authLoading } = useAuth()

  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)

  // Users list
  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersError, setUsersError] = useState<string | null>(null)
  const [usersLoading, setUsersLoading] = useState(false)
  const [roleFilter, setRoleFilter] = useState<GetUsersFilters['role'] | ''>('')
  const [search, setSearch] = useState('')

  // Pending sellers
  const [pendingSellers, setPendingSellers] = useState<AdminUser[]>([])
  const [pendingError, setPendingError] = useState<string | null>(null)
  const [pendingLoading, setPendingLoading] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState<number | null>(null)
  const [approvalMsg, setApprovalMsg] = useState<string | null>(null)

  const activeToken = token ?? ''

  // Fetch stats
  const fetchStats = async () => {
    try {
      const data = await getAdminStats(activeToken)
      setStats(data)
      setStatsError(null)
    } catch (err: any) {
      setStatsError(err?.message ?? 'Failed to load stats')
    }
  }

  // Fetch users
  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const filters: GetUsersFilters = {}
      if (roleFilter) filters.role = roleFilter
      if (search.trim()) filters.search = search.trim()
      const data = await getAdminUsers(activeToken, filters)
      setUsers(data)
      setUsersError(null)
    } catch (err: any) {
      setUsersError(err?.message ?? 'Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }

  // Fetch pending sellers
  const fetchPending = async () => {
    setPendingLoading(true)
    try {
      const data = await getPendingSellers(activeToken)
      setPendingSellers(data)
      setPendingError(null)
    } catch (err: any) {
      setPendingError(err?.message ?? 'Failed to load pending sellers')
    } finally {
      setPendingLoading(false)
    }
  }

  // Initial data load
  useEffect(() => {
    if (!activeToken || !user || user.role !== 'admin') return
    fetchStats()
    fetchUsers()
    fetchPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeToken, user])

  // Approve / reject a seller
  const handleApproval = async (userId: number, approve: boolean) => {
    setApprovalLoading(userId)
    setApprovalMsg(null)
    try {
      await approveSeller(activeToken, userId, approve)
      setApprovalMsg(approve ? 'Seller approved.' : 'Seller rejected.')
      await Promise.all([fetchPending(), fetchStats(), fetchUsers()])
    } catch (err: any) {
      setApprovalMsg(err?.message ?? 'Action failed')
    } finally {
      setApprovalLoading(null)
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800 }}>Admin Dashboard</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Logged in as <strong style={{ color: 'var(--text)' }}>{user.username}</strong>
        </span>
      </div>

      {/* ── Section 1: Stats ─────────────────────────────────────── */}
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

      {/* ── Section 2: Pending seller approvals ──────────────────── */}
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

      {/* ── Section 3: Users list ─────────────────────────────────── */}
      <section style={divider}>
        <SectionHeading title="All users" />

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <select
            className="form-input"
            style={{ width: 'auto', minWidth: 130 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as GetUsersFilters['role'] | '')}
          >
            <option value="">All roles</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 180 }}
            placeholder="Search by username or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn-secondary" onClick={fetchUsers} disabled={usersLoading}>
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
                  {['ID', 'Username', 'Email', 'Role', 'Seller approved', 'Joined'].map((col) => (
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
                      {u.role === 'seller' ? (u.selling_approve ? '✓' : '—') : ''}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(u.created_at).toLocaleDateString()}
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
