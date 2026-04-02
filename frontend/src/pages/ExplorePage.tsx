import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPublicProducts } from '../lib/marketplace'
import { listStores, type StoreProfile } from '../lib/stores'
import { getStoreRatings } from '../lib/ratings'
import type { PublicProduct } from '../lib/marketplace'
import { useSearch } from '../main'

export default function ExplorePage() {
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stores, setStores] = useState<Record<number, StoreProfile>>({})
  const [storeRatings, setStoreRatings] = useState<Record<number, { score: number; count: number }>>({})
  const { searchQuery, setSearchQuery } = useSearch()
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    async function loadProducts() {
      setLoading(true)
      try {
        const [productData, storeData] = await Promise.all([
          getPublicProducts({ search: debouncedSearch }),
          listStores()
        ])
        
        const productItems = productData.items || (productData as any).products || []
        setProducts(productItems)
        
        const storeMap = storeData.items.reduce((acc: any, s: StoreProfile) => {
          acc[s.id] = s
          return acc
        }, {})
        setStores(storeMap)

        // Fetch ratings for unique stores present in results
        const uniqueStoreIds = Array.from(new Set(productItems.map((p: any) => p.store_id)))
        const ratingsResults = await Promise.all(
          uniqueStoreIds.map(async (sid: any) => {
             try {
                const r = await getStoreRatings(sid)
                return { id: sid, score: r.average_score, count: r.total_ratings }
             } catch {
                return { id: sid, score: 0, count: 0 }
             }
          })
        )
        const ratingsMap = ratingsResults.reduce((acc: any, res: any) => {
           acc[res.id] = { score: res.score, count: res.count }
           return acc
        }, {})
        setStoreRatings(ratingsMap)
        
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [debouncedSearch])

  return (
    <div className="explore-page-wrapper" style={{ padding: '2rem 5%' }}>
      <header className="explore-header" style={{ display: searchQuery ? 'none' : 'block', textAlign: 'left', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Explore Marketplace
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Discover unique products from sellers all over the platform
        </p>
      </header>

      {loading && products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p>Finding items for you...</p>
        </div>
      ) : error ? (
        <div className="validation-hint invalid" style={{ textAlign: 'center', padding: '2rem' }}>
          {error}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--glass)', borderRadius: '1rem', maxWidth: '800px', margin: '0 auto', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>No products found matching "{searchQuery}"</p>
          <button className="btn-secondary" onClick={() => setSearchQuery('')}>
            Clear Search
          </button>
        </div>
      ) : (
        <div className="store-product-grid">
          {products.map((product) => {
            const thumbnail = product.images?.[0]?.image_url;
            const isSold = product.status === 'sold';

            return (
              <Link
                key={product.id}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <h3 className="store-product-card-title" style={{ margin: 0 }}>{product.title}</h3>
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>by <strong>{stores[product.store_id]?.name || 'Store'}</strong></span>
                    {storeRatings[product.store_id]?.count > 0 && (
                      <>
                        <span style={{ opacity: 0.3 }}>|</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#fbbf24' }}>
                          <svg style={{ width: '0.8rem', height: '0.8rem' }} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span style={{ fontWeight: 700 }}>{Number(storeRatings[product.store_id]?.score).toFixed(1)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="store-product-card-footer">
                    <span className="store-product-card-price">
                      ฿{parseFloat(product.price).toLocaleString()}
                    </span>
                    <span className="store-product-card-cta">View details →</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
