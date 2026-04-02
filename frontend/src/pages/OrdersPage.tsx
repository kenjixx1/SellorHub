import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listMyOrders, updateOrderStatus } from '../lib/orders'
import { listStores, type StoreProfile } from '../lib/stores'
import { createRating, getStoreRatings, updateRating } from '../lib/ratings'
import type { OrderResponse } from '../lib/types'

const STATUS_TABS = ['all', 'placed', 'paid', 'packing', 'shipped', 'delivered_pending_confirm', 'delivered', 'cancelled']

const statusConfig: Record<string, { color: string; label: string }> = {
  placed: { color: '#818cf8', label: 'To Pay' },
  paid: { color: '#6366f1', label: 'To Ship' },
  packing: { color: '#f59e0b', label: 'Packing' },
  shipped: { color: '#10b981', label: 'To Receive' },
  delivered_pending_confirm: { color: '#f97316', label: 'Confirm Receipt' },
  delivered: { color: '#059669', label: 'Completed' },
  cancelled: { color: '#ef4444', label: 'Cancelled' },
  refunded: { color: '#94a3b8', label: 'Refunded' }
}

export default function OrdersPage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [stores, setStores] = useState<Record<number, StoreProfile>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [ratingOrder, setRatingOrder] = useState<OrderResponse | null>(null)
  const [ratingScore, setRatingScore] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  useEffect(() => {
    if (!token) return
    loadData()
  }, [token])

  const loadData = async () => {
    setLoading(true)
    try {
      const [orderList, allStores] = await Promise.all([
        listMyOrders(token!),
        listStores()
      ])

      setOrders(orderList.items)

      const storeMap = allStores.items.reduce((acc: any, s: StoreProfile) => {
        acc[s.id] = s
        return acc
      }, {})
      setStores(storeMap)

    } catch (err: any) {
      setError(err?.message ?? 'Failed to load tracking data')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReceipt = async (orderId: number) => {
    if (!token) return
    setConfirmingId(orderId)
    try {
      await updateOrderStatus(token, orderId, 'delivered')
      await loadData()
    } catch (err: any) {
      alert(err?.message ?? 'Failed to confirm receipt')
    } finally {
      setConfirmingId(null)
    }
  }

  const handleSubmitRating = async () => {
    if (!token || !ratingOrder || !user) return
    setSubmittingRating(true)
    const payload = {
      store_id: ratingOrder.store_id,
      score: ratingScore,
      comment: ratingComment,
      order_id: ratingOrder.id
    }
    
    try {
      await createRating(token, payload)
      alert('Thank you for your rating!')
      setRatingOrder(null)
      setRatingComment('')
      setRatingScore(5)
    } catch (err: any) {
      if (err?.message?.includes('already rated') || err?.message?.includes('Use PUT to update')) {
        try {
          // Find the existing rating ID
          const summary = await getStoreRatings(ratingOrder.store_id, 1, 100)
          const existing = summary.ratings.find(r => r.buyer_id === user.id)
          
          if (existing) {
            await updateRating(token, existing.id, {
              score: ratingScore,
              comment: ratingComment
            })
            alert('Your rating has been updated!')
            setRatingOrder(null)
            setRatingComment('')
            setRatingScore(5)
            return
          }
        } catch (updateErr: any) {
          console.error('Update failed:', updateErr)
        }
      }
      alert(err?.message ?? 'Failed to submit rating.')
    } finally {
      setSubmittingRating(false)
    }
  }

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'all') return true
    return o.status.toLowerCase() === activeTab
  })

  if (!user) {
    return <div className="page-container">Please log in to track your orders.</div>
  }

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/explore')}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <svg style={{ width: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>My Purchases</h1>
      </div>

      {error && (
        <div style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.1)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {/* Shopee-style Navigation Tabs */}
      <div style={{
        display: 'flex',
        marginBottom: '1.5rem',
        background: 'var(--glass)',
        borderRadius: '0.75rem',
        padding: '0.25rem',
        overflowX: 'auto',
        border: '1px solid var(--border)'
      }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              flex: '0 0 auto',
              minWidth: tab === 'all' ? '52px' : undefined,
              padding: '0.75rem 0.75rem',
              background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'none',
              border: 'none',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderRadius: '0.5rem',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              lineHeight: 1.25,
              boxSizing: 'border-box'
            }}
          >
            {tab === 'all' ? 'All' : statusConfig[tab]?.label || tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Updating tracking info...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '5rem 2rem',
          background: 'var(--glass)',
          borderRadius: '1rem',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '4rem', opacity: 0.5 }}>📦</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No orders found for this status.</p>
          <Link to="/explore" className="btn-primary" style={{ marginTop: '1rem', padding: '0.75rem 2rem' }}>Start Shopping</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredOrders.map(order => {
            const store = stores[order.store_id]
            const config = statusConfig[order.status.toLowerCase()] || { color: '#94a3b8', label: order.status }

            return (
              <div key={order.id} style={{
                background: 'var(--glass)',
                borderRadius: '1rem',
                border: '1px solid var(--border)',
                overflow: 'hidden',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {/* Store Header */}
                <div style={{
                  padding: '1rem 1.25rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '24px', height: '24px', background: 'var(--primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: '0.9rem', color: '#fff' }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
                      </svg>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{store?.name || `Store #${order.store_id}`}</span>
                  </div>
                  <div style={{ color: config.color, fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    {config.label}
                  </div>
                </div>

                {/* Items Summary */}
                <div style={{ padding: '1.25rem' }}>
                  {order.items.map((item, idx) => (
                    <div key={item.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr auto',
                      gap: '1rem',
                      paddingBottom: idx === order.items.length - 1 ? 0 : '1rem',
                      marginBottom: idx === order.items.length - 1 ? 0 : '1rem',
                      borderBottom: idx === order.items.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)'
                    }}>
                      <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg style={{ width: '2rem', color: 'rgba(255,255,255,0.1)' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{item.product_title_snapshot}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Quantity: {item.quantity}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: 'var(--text)' }}>
                        ฿{Number(item.unit_price_snapshot * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer and Summary */}
                <div style={{
                  padding: '1.25rem',
                  background: 'rgba(0,0,0,0.1)',
                  borderTop: '1px dashed var(--border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'baseline',
                  gap: '1rem'
                }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Order Total:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>฿{Number(order.total_amount).toLocaleString()}</span>
                </div>

                {/* CTA footer */}
                <div style={{
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border)'
                }}>
                  <span style={{ flex: '1 1 8rem', minWidth: 0 }}>Order ID: {order.order_number}</span>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', flex: '1 1 auto' }}>
                    {order.status.toLowerCase() === 'delivered_pending_confirm' && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleConfirmReceipt(order.id)}
                        disabled={confirmingId === order.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                          minHeight: '2.5rem',
                          padding: '0.5rem 1.125rem',
                          fontSize: '0.8125rem',
                          lineHeight: 1.25,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          border: '1px solid rgba(5, 150, 105, 0.35)',
                          background: 'rgba(5, 150, 105, 0.15)',
                          color: '#34d399',
                          boxShadow: 'none'
                        }}
                      >
                        {confirmingId === order.id ? 'Confirming...' : 'Confirm Receipt'}
                      </button>
                    )}
                    <button type="button" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', flexShrink: 0 }}>Buy Again</button>
                    {order.status.toLowerCase() === 'delivered' && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setRatingOrder(order)}
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.75rem',
                          flexShrink: 0,
                          background: 'rgba(255,191,0,0.1)',
                          color: '#fbbf24',
                          border: '1px solid rgba(251,191,36,0.3)'
                        }}
                      >
                        Rate Store
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rating Modal */}
      {ratingOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '1.5rem', width: '100%', maxWidth: '450px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 800 }}>Rate your experience</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              How was your purchase from <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{stores[ratingOrder.store_id]?.name || 'the store'}</span>?
            </p>

            {/* Star Rating */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRatingScore(star)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: 'transform 0.1s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <svg style={{ width: '2.5rem', height: '2.5rem', color: star <= ratingScore ? '#fbbf24' : 'rgba(255,255,255,0.1)' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Share your thoughts (optional)</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Tell others about the product quality and seller's service..."
                style={{
                  width: '100%', minHeight: '120px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)',
                  borderRadius: '0.75rem', color: '#fff', padding: '1rem', fontSize: '0.9rem', resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setRatingOrder(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.8rem' }}
                disabled={submittingRating}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                className="btn-primary"
                style={{ flex: 2, padding: '0.8rem' }}
                disabled={submittingRating}
              >
                {submittingRating ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
