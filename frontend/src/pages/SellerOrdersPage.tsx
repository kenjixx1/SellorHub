import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { listStoreOrders, updateOrderStatus } from '../lib/orders'
import type { OrderResponse } from '../lib/types'

const STATUSES = ['all', 'placed', 'paid', 'packing', 'shipped', 'delivered_pending_confirm', 'delivered', 'cancelled']

const STATUS_LABELS: Record<string, string> = {
  all: 'All',
  placed: 'Placed',
  paid: 'Paid',
  packing: 'Packing',
  shipped: 'Shipped',
  delivered_pending_confirm: 'Awaiting Confirm',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const statusColors: Record<string, string> = {
  placed: '#818cf8',
  paid: '#6366f1',
  packing: '#f59e0b',
  shipped: '#10b981',
  delivered_pending_confirm: '#f97316',
  delivered: '#059669',
  cancelled: '#ef4444',
  refunded: '#94a3b8'
}

export default function SellerOrdersPage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState('all')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  useEffect(() => {
    if (!token) return
    loadOrders()
  }, [token, activeStatus])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const statusFilter = activeStatus === 'all' ? undefined : activeStatus
      const res = await listStoreOrders(token!, statusFilter)
      setOrders(res.items)
      setError(null)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    if (!token) return
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(token, orderId, nextStatus)
      await loadOrders()
    } catch (err: any) {
      alert(err?.message ?? 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  if (!user || user.role !== 'seller') {
     return <div className="page-container">Access Denied</div>
  }

  return (
    <div className="page-container" style={{ maxWidth: '1000px' }}>
      <button 
        onClick={() => navigate('/seller')} 
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
        Back to Dashboard
      </button>

      <h1 style={{ marginBottom: '2rem' }}>Order Management</h1>

      {error && (
        <div
          style={{
            color: '#fca5a5',
            background: 'rgba(239,68,68,0.1)',
            padding: '1rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
      }}>
        {STATUSES.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveStatus(s)}
            style={{
              padding: '0.5rem 1rem',
              background: activeStatus === s ? 'rgba(99,102,241,0.1)' : 'none',
              border: 'none',
              color: activeStatus === s ? 'var(--primary)' : 'var(--text-muted)',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {STATUS_LABELS[s] ?? s}
          </button>
        ))}
      </div>

      {loading && orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--glass)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No orders found for this status.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map(order => (
            <div key={order.id} style={{ 
              background: 'var(--glass)', 
              borderRadius: '1rem', 
              border: '1px solid var(--border)',
              overflow: 'hidden'
            }}>
              {/* Card Header */}
              <div style={{ 
                padding: '1.25rem', 
                background: 'rgba(255,255,255,0.02)', 
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', marginRight: '1rem' }}>#{order.order_number}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(order.created_at).toLocaleString()}</span>
                </div>
                <div style={{ 
                  background: (statusColors[order.status.toLowerCase()] || '#94a3b8') + '22',
                  color: statusColors[order.status.toLowerCase()] || '#94a3b8',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '99px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {order.status}
                </div>
              </div>

              {/* Items Section */}
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {order.items.map(item => (
                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600 }}>{item.product_title_snapshot || 'Product Name'}</div>
                      <div style={{ color: 'var(--text-muted)', textAlign: 'right' }}>x{item.quantity}</div>
                      <div style={{ textAlign: 'right', fontWeight: 600 }}>฿{(item.unit_price_snapshot * item.quantity).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Footer */}
              <div style={{ 
                padding: '1.25rem', 
                borderTop: '1px dashed var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.01)'
              }}>
                <div style={{ fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Buyer ID: </span>
                  <span style={{ fontWeight: 600 }}>#{order.buyer_id}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Total Amount</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>฿{Number(order.total_amount).toLocaleString()}</div>
                </div>
              </div>

              {/* Status Actions — aligned with backend OrderService transitions */}
              <div style={{ 
                padding: '1.25rem', 
                background: 'rgba(255,255,255,0.03)', 
                borderTop: '1px solid var(--border)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                {order.status.toLowerCase() === 'placed' && (
                  <>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleUpdateStatus(order.id, 'paid')}
                      disabled={updatingId === order.id}
                    >
                      Mark as paid
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleUpdateStatus(order.id, 'packing')}
                      disabled={updatingId === order.id}
                    >
                      Start packing
                    </button>
                  </>
                )}
                {order.status.toLowerCase() === 'paid' && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleUpdateStatus(order.id, 'packing')}
                    disabled={updatingId === order.id}
                  >
                    Start packing
                  </button>
                )}
                {order.status.toLowerCase() === 'packing' && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleUpdateStatus(order.id, 'shipped')}
                    disabled={updatingId === order.id}
                  >
                    Mark as shipped
                  </button>
                )}
                {order.status.toLowerCase() === 'shipped' && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleUpdateStatus(order.id, 'delivered_pending_confirm')}
                    disabled={updatingId === order.id}
                    style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', borderColor: 'rgba(249, 115, 22, 0.3)' }}
                  >
                    Mark delivered (await confirm)
                  </button>
                )}
                {order.status.toLowerCase() === 'delivered_pending_confirm' && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => handleUpdateStatus(order.id, 'delivered')}
                    disabled={updatingId === order.id}
                  >
                    Confirm completed
                  </button>
                )}
                {(order.status.toLowerCase() === 'placed' || order.status.toLowerCase() === 'paid') && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                    disabled={updatingId === order.id}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                  >
                    Cancel order
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
