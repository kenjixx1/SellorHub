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
                  <h3 className="store-product-card-title">{product.title}</h3>
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
