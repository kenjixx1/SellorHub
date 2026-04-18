import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { storeService } from '../lib/services/storeService'
import { Store } from '../lib/models/Store'

const PAGE_SIZE = 20

// ── Store logo / avatar ───────────────────────────────────────────────────────

function StoreAvatar({ name, logoUrl, size = 56 }: { name: string; logoUrl?: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '0.75rem',
          objectFit: 'cover',
          border: '1px solid var(--border)',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '0.75rem',
        background: 'linear-gradient(135deg, #818cf8, #c084fc)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 800,
        color: 'white',
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Store card ────────────────────────────────────────────────────────────────

function StoreCard({ store }: { store: Store }) {
  return (
    <Link to={`/store/${store.slug}`} className="dir-store-card">
      <StoreAvatar name={store.name} logoUrl={store.logo_url} size={56} />
      <div className="dir-store-card-body">
        <h3 className="dir-store-card-name">{store.name}</h3>
        {store.description && (
          <p className="dir-store-card-desc">
            {store.description.length > 100
              ? store.description.slice(0, 100) + '…'
              : store.description}
          </p>
        )}
        <div className="dir-store-card-meta">
          {store.product_count != null && (
            <span>{store.product_count} product{store.product_count !== 1 ? 's' : ''}</span>
          )}
          <span>
            Joined {new Date(store.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      </div>
      <span className="dir-store-card-cta">Visit store →</span>
    </Link>
  )
}

// ── Skeleton loading card ─────────────────────────────────────────────────────

function SkeletonStoreCard() {
  return (
    <div className="dir-store-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton-block" style={{ width: 56, height: 56, borderRadius: '0.75rem', flexShrink: 0 }} />
      <div className="dir-store-card-body" style={{ flex: 1, gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
        <div className="skeleton-block" style={{ width: '45%', height: 18 }} />
        <div className="skeleton-block" style={{ width: '80%', height: 14 }} />
        <div className="skeleton-block" style={{ width: '35%', height: 12 }} />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await storeService.listStores({ search: debouncedSearch || undefined, page, limit: PAGE_SIZE })
      setStores(res.items.map(Store.fromDto))
      setTotal(res.total)
      setTotalPages(res.pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stores')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => { load() }, [load])

  return (
    <div className="dir-page-wrapper">

      {/* Header */}
      <div className="dir-page-header">
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '2rem', fontWeight: 800 }}>
            Browse Stores
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Discover sellers and their collections on SellorHub
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search stores…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              borderRadius: '99px',
              padding: '0.5rem 1rem 0.5rem 2.5rem',
              background: 'rgba(0,0,0,0.3)',
              height: 40,
              border: '1px solid var(--border)',
            }}
          />
          <svg
            style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: '1rem', height: '1rem', color: 'var(--text-muted)' }}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Result count */}
      {!loading && !error && (
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {debouncedSearch
            ? `${total} result${total !== 1 ? 's' : ''} for "${debouncedSearch}"`
            : `${total} store${total !== 1 ? 's' : ''} on SellorHub`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div
          className="validation-hint invalid"
          style={{ marginBottom: '1.5rem', borderRadius: '0.75rem', padding: '1rem 1.25rem' }}
        >
          {error}{' '}
          <button
            className="btn-secondary"
            style={{ marginLeft: '0.75rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
            onClick={load}
          >
            Retry
          </button>
        </div>
      )}

      {/* Store list */}
      <div className="dir-store-list">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonStoreCard key={i} />)
          : stores.length === 0
          ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '4rem 2rem',
                background: 'var(--glass)',
                borderRadius: '1rem',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏪</div>
              <h2 style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>No stores found</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                {debouncedSearch
                  ? `No stores matched "${debouncedSearch}". Try a different name.`
                  : 'No stores have been created yet. Be the first!'}
              </p>
              {debouncedSearch && (
                <button
                  className="btn-secondary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => setSearch('')}
                >
                  Clear search
                </button>
              )}
            </div>
          )
          : stores.map((s) => <StoreCard key={s.id} store={s} />)
        }
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="dir-pagination">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Previous
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
