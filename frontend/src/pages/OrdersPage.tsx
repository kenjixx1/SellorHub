import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listMyOrders } from '../lib/orders'
import { listStores, type StoreProfile } from '../lib/stores'
import type { OrderResponse } from '../lib/types'

const STATUS_TABS = ['all', 'placed', 'paid', 'packing', 'shipped', 'delivered', 'cancelled']

const statusConfig: Record<string, { color: string; label: string }> = {
  placed: { color: '#818cf8', label: 'To Pay' },
  paid: { color: '#6366f1', label: 'To Ship' },
  packing: { color: '#f59e0b', label: 'Packing' },
  shipped: { color: '#10b981', label: 'To Receive' },
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
            onClick={() => setActiveTab(tab)}
            style={{
              flex: '1',
              minWidth: tab === 'all' ? '60px' : '100px',
              padding: '0.75rem 0.5rem',
              background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'none',
              border: 'none',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              borderRadius: '0.5rem',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap'
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

                {/* CTA Overlay link behavior (optional enhancement) */}
                <div style={{ 
                  padding: '0.75rem 1.25rem', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid var(--border)'
                }}>
                  <span>Order ID: {order.order_number}</span>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Buy Again</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
