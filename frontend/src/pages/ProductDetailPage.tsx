import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProduct } from '../lib/marketplace'
import type { PublicProduct } from '../lib/marketplace'
import { apiFetch } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import { addToCart } from '../lib/cart'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<PublicProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState(0)

  // Cart state
  const [cartLoading, setCartLoading] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [buyQuantity, setBuyQuantity] = useState(1)
  const { token } = useAuth()
  
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

  async function handleAddToCart() {
    if (!token) {
      alert('Please log in to add items to your cart.')
      return
    }
    if (!product) return

    setCartLoading(true)
    try {
      await addToCart(token, product.id, buyQuantity)
      setCartSuccess(true)
      setTimeout(() => setCartSuccess(false), 3000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add to cart')
    } finally {
      setCartLoading(false)
    }
  }

  async function handleGoToPurchase() {
    if (!token) {
      alert('Please log in to purchase.')
      return
    }
    if (!product) return

    // Store as direct checkout item
    const directItem = {
      product_id: product.id,
      quantity: buyQuantity,
      product: {
        id: product.id,
        title: product.title,
        price: product.price,
        stock: product.stock,
        status: product.status,
        store_id: product.store_id,
        image_url: product.images && product.images.length > 0 ? product.images[0].image_url : null
      }
    }
    sessionStorage.setItem('buy_now_item', JSON.stringify(directItem))
    sessionStorage.removeItem('checkout_item_ids') // Clear cart-based checkout
    navigate('/checkout')
  }

  if (loading) return <div className="page-container"><p>Loading...</p></div>
  if (error || !product) return <div className="page-container"><p className="validation-hint invalid">{error || 'Product not found'}</p></div>

  return (
    <div className="product-detail-layout" style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ 
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem',
          padding: 0, fontWeight: 600, fontSize: '0.9rem'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <svg style={{ width: '1.1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

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

          <div className="quantity-selector" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quantity</span>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
              <button 
                style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', border: 'none', color: '#fff', cursor: 'pointer' }}
                onClick={() => setBuyQuantity(q => Math.max(1, q - 1))}
              >-</button>
              <div style={{ padding: '0.4rem 1.25rem', minWidth: '45px', textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>
                {buyQuantity}
              </div>
              <button 
                style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', border: 'none', color: '#fff', cursor: 'pointer' }}
                onClick={() => setBuyQuantity(q => (!product || product.stock === null || product.stock === undefined || q < product.stock) ? q + 1 : q)}
              >+</button>
            </div>
            {product.stock !== null && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{product.stock} items left</span>
            )}
          </div>

          <div className="buy-actions" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button 
              className="btn-secondary" 
              style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '8px', minWidth: '160px' }}
              onClick={handleAddToCart}
              disabled={cartLoading}
            >
              <svg style={{ width: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartSuccess ? 'Added!' : 'Add to Cart'}
            </button>
            <button className="btn-primary" style={{ flex: 1.5, borderRadius: '8px', fontSize: '1.1rem', fontWeight: 700 }} onClick={handleGoToPurchase}>
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
