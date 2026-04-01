import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPublicProducts } from '../lib/marketplace'
import type { PublicProduct } from '../lib/marketplace'
import { useSearch } from '../main'

export default function ExplorePage() {
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        const data = await getPublicProducts({ search: debouncedSearch })
        setProducts(data.items || (data as any).products || [])
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
    <div className="explore-page-wrapper">
      <header className="explore-header" style={{ display: searchQuery ? 'none' : 'block' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          Explore <span>Marketplace</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
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
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--glass)', borderRadius: '1rem', maxWidth: '800px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.2rem' }}>No products found matching "{searchQuery}"</p>
          <button className="btn-secondary" onClick={() => setSearchQuery('')} style={{ marginTop: '1rem' }}>
            Clear Search
          </button>
        </div>
      ) : (
        <div className="full-grid">
          {products.map((product) => {
             const thumbnail = product.images?.[0]?.image_url;
             const isSold = product.status === 'sold';
             
             return (
              <Link key={product.id} to={`/products/${product.id}`} className="product-card">
                <div className="product-card-image">
                  {isSold && <div className="sold-badge">Sold</div>}
                  {thumbnail ? (
                    <img src={thumbnail} alt={product.title} loading="lazy" />
                  ) : (
                    <div className="image-placeholder">No Image</div>
                  )}
                  <div className="product-card-price">
                    ฿{parseFloat(product.price).toLocaleString()}
                  </div>
                </div>
                <div className="product-card-content">
                  <h3 className="product-card-title">{product.title}</h3>
                </div>
              </Link>
             )
          })}
        </div>
      )}
    </div>
  )
}
