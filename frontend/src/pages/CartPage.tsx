import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { cartService } from '../lib/services/cartService'
import { storeService } from '../lib/services/storeService'
import { API_BASE_URL } from '../lib/api'
import { Cart, CartItem } from '../lib/models'
import { Store } from '../lib/models/Store'

export default function CartPage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stores, setStores] = useState<Record<number, Store>>({})

  // Selection state
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([])

  useEffect(() => {
    if (!token) return
    loadCart()
  }, [token])

  const loadCart = async () => {
    setLoading(true)
    try {
      const data = await cartService.getCart(token!)
      setCart(Cart.fromDto(data))

      // Resolve store names
      const storeIds = Array.from(new Set(data.items.map(i => i.product.store_id)))
      await resolveStoreNames(storeIds)

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const resolveStoreNames = async (storeIds: number[]) => {
    const missingIds = storeIds.filter(id => !stores[id])
    if (missingIds.length === 0) return

    try {
      // Since we don't have a bulk-get-by-id, we'll try to find them in the stores list
      // Or just fetch all stores (Marketplace typically doesn't have thousands in one cart context)
      const res = await storeService.listStores({ limit: 100 })
      const storeMap: Record<number, Store> = { ...stores }
      res.items.forEach(s => {
        if (storeIds.includes(s.id)) {
          storeMap[s.id] = Store.fromDto(s)
        }
      })
      setStores(storeMap)
    } catch (err) {
      console.error('Failed to resolve store names', err)
    }
  }

  // Handle Selection
  const toggleItem = (id: number) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleStore = (_storeId: number, itemIds: number[]) => {
    const allSelected = itemIds.every(id => selectedItemIds.includes(id))
    if (allSelected) {
      setSelectedItemIds(prev => prev.filter(id => !itemIds.includes(id)))
    } else {
      setSelectedItemIds(prev => Array.from(new Set([...prev, ...itemIds])))
    }
  }

  const toggleAll = () => {
    if (!cart) return
    const allIds = cart.items.map(i => i.id)
    if (selectedItemIds.length === allIds.length) {
      setSelectedItemIds([])
    } else {
      setSelectedItemIds(allIds)
    }
  }

  // Operations
  const handleQuantity = async (item: CartItem, delta: number) => {
    if (!token) return
    const newQty = item.quantity + delta
    if (newQty < 1) return
    if (typeof item.product.stock === 'number' && newQty > item.product.stock) return

    try {
      const updatedCart = await cartService.updateItem(token, item.id, newQty)
      setCart(Cart.fromDto(updatedCart))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const handleDelete = async (id: number) => {
    if (!token || !confirm('Remove this item from your cart?')) return
    try {
      const updatedCart = await cartService.removeItem(token, id)
      setCart(Cart.fromDto(updatedCart))
      setSelectedItemIds(prev => prev.filter(i => i !== id))
    } catch (err) {
      alert('Delete failed')
    }
  }

  // Group by store
  const groups = useMemo(() => {
    if (!cart) return []
    const map: Record<number, CartItem[]> = {}
    cart.items.forEach(item => {
      const sid = item.product.store_id
      if (!map[sid]) map[sid] = []
      map[sid].push(item)
    })
    return Object.entries(map).map(([sid, items]) => ({
      storeId: Number(sid),
      store: stores[Number(sid)],
      items
    }))
  }, [cart, stores])

  // Calculation
  const selectedItems = (cart?.items || []).filter(i => selectedItemIds.includes(i.id))
  const totalAmount = selectedItems.reduce((sum, i) => sum + (Number(i.product.price) * i.quantity), 0)

  if (!user) return <div className="page-container">Please log in to view your cart.</div>

  return (
    <div className="page-container" style={{
      maxWidth: '1000px',
      paddingBottom: cart?.items.length === 0 ? '4rem' : '180px',
      minHeight: cart?.items.length === 0 ? 'auto' : '80vh'
    }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2.25rem' }}>Shopping Cart</h1>
        {cart && cart.items.length > 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem', marginTop: '0.5rem' }}>{cart.itemCount()} items</span>
        )}
      </div>

      {loading && !cart ? (
        <div style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div className="loading-spinner" style={{ marginBottom: '1rem' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Loading your cart...</p>
        </div>
      ) : error ? (
        <div className="validation-hint invalid" style={{ marginBottom: '2rem' }}>{error}</div>
      ) : cart?.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--glass)', borderRadius: '1.25rem', border: '1px solid var(--border)', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ opacity: 0.15, fontSize: '3rem', marginBottom: '0.75rem' }}>🛒</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '1.5rem' }}>Your shopping cart is currently empty.</p>
          <Link to="/explore" className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}>Continue Discovery</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '45px 3fr 1fr 1.2fr 1.2fr 45px',
            padding: '1.25rem',
            background: 'var(--glass)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border)',
            fontWeight: 800,
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div /> {/* Spacer for checkboxes */}
            <div>Product</div>
            <div style={{ textAlign: 'center' }}>Price</div>
            <div style={{ textAlign: 'center' }}>Quantity</div>
            <div style={{ textAlign: 'center' }}>Subtotal</div>
            <div></div>
          </div>

          {/* Store Groups */}
          {groups.map(group => (
            <div key={group.storeId} style={{
              background: 'var(--glass)',
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              {/* Store Header */}
              <div style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                background: 'rgba(255,255,255,0.03)'
              }}>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px' }}
                  checked={group.items.length > 0 && group.items.every(i => selectedItemIds.includes(i.id))}
                  onChange={() => toggleStore(group.storeId, group.items.map(i => i.id))}
                />
                <Link to={group.store ? `/store/${group.store.slug}` : '#'} style={{ fontWeight: 700, color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.05rem' }}>
                  <svg style={{ width: '1.1rem', color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {group.store?.name || `Store #${group.storeId}`}
                </Link>
              </div>

              {/* Items */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {group.items.map(item => (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '45px 3fr 1fr 1.2fr 1.2fr 45px',
                    padding: '1.5rem 1.25rem',
                    borderBottom: '1px solid var(--border)',
                    alignItems: 'center',
                    minHeight: '120px'
                  }}>
                    <input
                      type="checkbox"
                      style={{ width: '18px', height: '18px' }}
                      checked={selectedItemIds.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />

                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '0.75rem',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--border)'
                      }}>
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url.startsWith('http') ? item.product.image_url : `${API_BASE_URL}${item.product.image_url}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            alt={item.product.title}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Image</div>
                        )}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <Link to={`/products/${item.product.id}`} style={{ display: 'block', fontWeight: 600, color: '#fff', textDecoration: 'none', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                          {item.product.title}
                        </Link>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {typeof item.product.stock === 'number' && item.product.stock < 10 ? (
                            <span style={{ color: '#f87171' }}>Only {item.product.stock} items left!</span>
                          ) : (
                            <span style={{ color: '#4ade80' }}>Available in stock</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', fontWeight: '500', fontSize: '1.05rem' }}>฿{Number(item.product.price).toLocaleString()}</div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                        <button
                          style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', transition: 'background 0.2s' }}
                          onClick={() => handleQuantity(item, -1)}
                          className="qty-btn"
                          disabled={item.quantity <= 1}
                        >-</button>
                        <div style={{ padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.02)', minWidth: '45px', textAlign: 'center', fontSize: '1rem', fontWeight: 600 }}>
                          {item.quantity}
                        </div>
                        <button
                          style={{ padding: '0.4rem 0.8rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', transition: 'background 0.2s' }}
                          onClick={() => handleQuantity(item, 1)}
                          className="qty-btn"
                          disabled={typeof item.product.stock === 'number' && item.quantity >= item.product.stock}
                        >+</button>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
                      ฿{item.lineTotal().toLocaleString()}
                    </div>

                    <button
                      style={{ background: 'none', border: 'none', color: '#f87171', padding: '0.5rem', cursor: 'pointer', opacity: 0.8 }}
                      onClick={() => handleDelete(item.id)}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                      title="Remove Item"
                    >
                      <svg style={{ width: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ height: '2rem' }}></div> {/* Spacer */}
        </div>
      )}

      {/* Sticky Footer */}
      {cart && cart.items.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 3rem)',
          maxWidth: '1000px',
          background: 'rgba(18, 18, 18, 0.9)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--primary)',
          borderRadius: '1.25rem',
          padding: '1.5rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="checkbox"
                id="footer-select-all"
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                checked={selectedItemIds.length > 0 && selectedItemIds.length === cart.items.length}
                onChange={toggleAll}
              />
              <label htmlFor="footer-select-all" style={{ fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Select All ({cart.items.length})</label>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Total ({selectedItemIds.length} {(selectedItemIds.length === 1 ? 'item' : 'items')}):
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                ฿{totalAmount.toLocaleString()}
              </div>
            </div>
            <button
              className="btn-primary"
              style={{ padding: '1rem 3rem', fontSize: '1.2rem', fontWeight: 800, borderRadius: '10px', boxShadow: '0 4px 15px rgba(129, 140, 248, 0.3)' }}
              onClick={() => {
                if (selectedItemIds.length === 0) {
                  alert('Please select at least one item to checkout.')
                  return
                }
                sessionStorage.removeItem('buy_now_item')
                sessionStorage.setItem('checkout_item_ids', JSON.stringify(selectedItemIds))
                navigate('/checkout')
              }}
            >
              Check Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
