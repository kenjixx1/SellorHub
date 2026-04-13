import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { storeService } from '../lib/services/storeService'
import { ratingService } from '../lib/services/ratingService'
import type { StoreProfile, ProductGroup, SellerProduct, StoreSummaryRating } from '../lib/types'
import { ApiError, API_BASE_URL } from '../lib/api'

// ── Product card (rectangular) ────────────────────────────────────────────────

function ProductCard({ product }: { product: SellerProduct }) {
  const thumbnail = product.images?.[0]?.image_url
  const isSold = product.status === 'sold'

  return (
    <Link
      to={`/products/${product.id}`}
      className="store-product-card"
      style={{ opacity: isSold ? 0.7 : 1 }}
    >
      <div className="store-product-card-image">
        {thumbnail ? (
          <img src={thumbnail} alt={product.title} loading="lazy" />
        ) : (
          <div className="store-product-card-placeholder">No Image</div>
        )}
        {isSold && <div className="store-product-sold-badge">Sold</div>}
      </div>
      <div className="store-product-card-body">
        <h3 className="store-product-card-title">{product.title}</h3>
        {product.description && (
          <p className="store-product-card-desc">
            {product.description.length > 80
              ? product.description.slice(0, 80) + '…'
              : product.description}
          </p>
        )}
        <div className="store-product-card-footer">
          <span className="store-product-card-price">
            ฿{Number(product.price).toLocaleString()}
          </span>
          <span className="store-product-card-cta">View details →</span>
        </div>
      </div>
    </Link>
  )
}

// ── Product section (one per group) ──────────────────────────────────────────

function ProductSection({
  title,
  products,
}: {
  title: string
  products: SellerProduct[]
}) {
  if (products.length === 0) return null

  return (
    <section className="store-product-section">
      <h2 className="store-section-title">{title}</h2>
      <div className="store-product-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

// ── Store logo placeholder ────────────────────────────────────────────────────

function StoreLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        style={{
          width: 72,
          height: 72,
          borderRadius: '1rem',
          objectFit: 'cover',
          border: '2px solid var(--border)',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: '1rem',
        background: 'linear-gradient(135deg, #818cf8, #c084fc)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        fontWeight: 800,
        color: 'white',
        flexShrink: 0,
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PublicStorePage() {
  const { slug } = useParams<{ slug: string }>()

  const [store, setStore] = useState<StoreProfile | null>(null)
  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [ratings, setRatings] = useState<StoreSummaryRating | null>(null)

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setNotFound(false)
      setError(null)

      try {
        const [storeData, groupsData, productsData] = await Promise.all([
          storeService.getProfile(slug!),
          storeService.getGroups(slug!),
          storeService.getProducts(slug!, { limit: 100 }),
        ])

        if (cancelled) return

        setStore(storeData)
        setGroups(groupsData)
        setProducts(productsData.products)

        const ratingsData = await ratingService.getStoreRatings(storeData.id)
        if (!cancelled) setRatings(ratingsData)
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load store')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug])

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="store-page-wrapper">
        <div className="store-header-skeleton">
          <div className="skeleton-block" style={{ width: 72, height: 72, borderRadius: '1rem' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-block" style={{ width: '40%', height: 28, marginBottom: 10 }} />
            <div className="skeleton-block" style={{ width: '70%', height: 16 }} />
          </div>
        </div>
        <div style={{ padding: '0 5%' }}>
          <div className="skeleton-block" style={{ width: '20%', height: 22, marginBottom: 16 }} />
          <div className="store-product-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="skeleton-block store-product-card" style={{ height: 200 }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────────

  if (notFound) {
    return (
      <div className="page-container" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.75rem', fontWeight: 800 }}>
          Store not found
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          There's no store at <strong>/store/{slug}</strong>. The URL may have changed or the store may no longer exist.
        </p>
        <Link to="/explore" className="btn-secondary">
          Browse marketplace
        </Link>
      </div>
    )
  }

  // ── API error ────────────────────────────────────────────────────────────────

  if (error || !store) {
    return (
      <div className="page-container" style={{ maxWidth: 480, textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 0.75rem' }}>Something went wrong</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{error ?? 'Unknown error'}</p>
        <button className="btn-secondary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    )
  }

  // ── Build grouped sections client-side ───────────────────────────────────────

  const groupedProducts: Record<number, SellerProduct[]> = {}
  const ungroupedProducts: SellerProduct[] = []

  for (const p of products) {
    if (p.group_id != null) {
      if (!groupedProducts[p.group_id]) groupedProducts[p.group_id] = []
      groupedProducts[p.group_id].push(p)
    } else {
      ungroupedProducts.push(p)
    }
  }

  const hasAnyProducts = products.length > 0

  // ── Full page ────────────────────────────────────────────────────────────────

  return (
    <div className="store-page-wrapper">

      {/* Store header */}
      <div className="store-header">
        <div className="store-header-inner">
          <StoreLogo name={store.name} logoUrl={store.logo_url} />
          <div className="store-header-info">
            <h1 className="store-header-name">{store.name}</h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              sellor.com/store/<strong style={{ color: 'var(--primary)' }}>{store.slug}</strong>
            </div>
            {store.description && (
              <p className="store-header-desc">{store.description}</p>
            )}
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {store.product_count != null && (
                <span>{store.product_count} products</span>
              )}
              {ratings && ratings.total_ratings > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#fbbf24' }}>
                  <svg style={{ width: '1rem', height: '1rem' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span style={{ fontWeight: 700 }}>{Number(ratings.average_score).toFixed(1)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({ratings.total_ratings} reviews)</span>
                </div>
              )}
              <span>Joined {new Date(store.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog */}
      <div className="store-catalog">

        {/* Empty store */}
        {!hasAnyProducts && (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'var(--glass)',
              borderRadius: '1rem',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h2 style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>No products yet</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              This store hasn't listed any products yet. Check back soon!
            </p>
          </div>
        )}

        {/* Grouped sections */}
        {groups.map((group) => {
          const groupProds = groupedProducts[group.id] ?? []
          return (
            <ProductSection
              key={group.id}
              title={group.name}
              products={groupProds}
            />
          )
        })}

        {/* Ungrouped products */}
        {ungroupedProducts.length > 0 && (
          <ProductSection
            title={groups.length > 0 ? 'Other Products' : 'Products'}
            products={ungroupedProducts}
          />
        )}

        {/* Reviews Section */}
        {ratings && ratings.total_ratings > 0 && (
          <section style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
             <h2 className="store-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                Buyer Reviews
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>({ratings.total_ratings})</span>
             </h2>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
               {ratings.ratings.map(rating => (
                 <div key={rating.id} style={{ background: 'var(--glass)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                         {rating.buyer?.avatar_url ? (
                            <img 
                              src={rating.buyer.avatar_url.startsWith('http') ? rating.buyer.avatar_url : `${API_BASE_URL}${rating.buyer.avatar_url}`} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                              alt={rating.buyer.username}
                            />
                         ) : (
                            rating.buyer?.username.charAt(0).toUpperCase() || '?'
                         )}
                       </div>
                       <div>
                         <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rating.buyer?.username || 'Verified Buyer'}</div>
                         <div style={{ display: 'flex', gap: '2px', marginTop: '0.2rem' }}>
                           {[1,2,3,4,5].map(s => (
                             <svg key={s} style={{ width: '0.8rem', height: '0.8rem', color: s <= rating.score ? '#fbbf24' : 'rgba(255,255,255,0.05)' }} fill="currentColor" viewBox="0 0 20 20">
                               <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                             </svg>
                           ))}
                         </div>
                       </div>
                     </div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                       {new Date(rating.created_at).toLocaleDateString()}
                     </div>
                   </div>
                   {rating.comment && (
                     <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>
                       {rating.comment}
                     </p>
                   )}
                 </div>
               ))}
             </div>
          </section>
        )}
      </div>
    </div>
  )
}
