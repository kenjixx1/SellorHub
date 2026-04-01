import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProduct } from '../lib/marketplace'
import type { PublicProduct } from '../lib/marketplace'
import { apiFetch } from '../lib/api'

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<PublicProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  
  // Inquiry form state
  const [inquiryName, setInquiryName] = useState('')
  const [inquiryEmail, setInquiryEmail] = useState('')
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [inquiryLoading, setInquiryLoading] = useState(false)
  const [inquirySuccess, setInquirySuccess] = useState(false)

  useEffect(() => {
    async function loadProduct() {
      if (!id) return
      setLoading(true)
      try {
        const data = await getProduct(parseInt(id))
        setProduct(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [id])

  async function handleInquiry(e: React.FormEvent) {
    e.preventDefault()
    if (!product) return
    
    setInquiryLoading(true)
    try {
      await apiFetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          buyer_name: inquiryName,
          buyer_email: inquiryEmail,
          message: inquiryMessage,
        }),
      })
      setInquirySuccess(true)
      setInquiryMessage('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send inquiry')
    } finally {
      setInquiryLoading(false)
    }
  }

  if (loading) return <div className="page-container"><p>Loading...</p></div>
  if (error || !product) return <div className="page-container"><p className="validation-hint invalid">{error || 'Product not found'}</p></div>

  return (
    <div className="product-detail-layout" style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Breadcrumbs (Stub) */}
      <nav style={{ padding: '1rem 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        <Link to="/explore" style={{ color: 'var(--primary)' }}>Explore</Link> / {product.title}
      </nav>

      <div className="product-detail-flex" style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        {/* Gallery Section - 60% approx */}
        <div className="gallery-section" style={{ flex: '1.2', minWidth: '350px' }}>
          <div className="main-image-viewport" style={{ background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1/1', border: '1px solid var(--border)', position: 'relative' }}>
             {product.images && product.images.length > 0 ? (
                <img src={product.images[activeImage]?.image_url || product.images[0].image_url} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
             ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No Image</div>
             )}
          </div>
          
          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
              {product.images.map((img, idx) => (
                <button 
                  key={img.id} 
                  onClick={() => setActiveImage(idx)}
                  style={{ 
                    padding: 0, 
                    border: activeImage === idx ? '2px solid var(--primary)' : '1px solid var(--border)', 
                    borderRadius: '4px', 
                    overflow: 'hidden', 
                    aspectRatio: '1/1', 
                    background: 'transparent', 
                    cursor: 'pointer' 
                  }}
                >
                  <img src={img.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Section - 40% approx */}
        <div className="info-section" style={{ flex: '0.8', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="info-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.5rem' }}>{product.title}</h1>
            <div className="price-tag" style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text)' }}>
              ฿{parseFloat(product.price).toLocaleString()}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '400', marginLeft: '0.5rem' }}>tax included</span>
            </div>
          </div>

          <div className="buy-actions" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Purchase Stub */}
            <button className="btn-primary btn-large" style={{ borderRadius: '8px', fontSize: '1.25rem' }}>
              Go to Purchase
            </button>
          </div>

          <div className="description-section">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', fontWeight: '700' }}>Description</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--text)', fontSize: '1rem' }}>
               {product.description || 'No description provided.'}
            </p>
          </div>

          <div className="seller-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
             <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Inquire with Seller</h3>
             {inquirySuccess ? (
              <div className="validation-hint valid" style={{ padding: '0.75rem', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '6px' }}>
                Inquiry sent successfully!
              </div>
            ) : (
              <form onSubmit={handleInquiry} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  className="form-input"
                  style={{ background: 'rgba(0,0,0,0.3)', height: '40px' }}
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  className="form-input"
                  style={{ background: 'rgba(0,0,0,0.3)', height: '40px' }}
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                />
                <textarea
                  placeholder="Message the seller..."
                  required
                  className="form-input"
                  rows={3}
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                ></textarea>
                <button type="submit" disabled={inquiryLoading} className="btn-secondary" style={{ borderRadius: '8px' }}>
                  {inquiryLoading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
