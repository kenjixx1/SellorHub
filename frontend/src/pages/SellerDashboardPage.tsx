import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { sellerService } from '../lib/services/sellerService'
import { productService } from '../lib/services/productService'
import { orderService } from '../lib/services/orderService'
import type { SellerDashboard, OrderResponse } from '../lib/types'
import { Product } from '../lib/models/Product'
import { ProductGroup } from '../lib/models/ProductGroup'
import { Inquiry } from '../lib/models/Inquiry'
import { ApiError } from '../lib/api'



function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        minWidth: 110,
      }}
    >
      <span style={{ fontSize: '1.6rem', fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        {label}
      </span>
    </div>
  )
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: '1.05rem',
        fontWeight: 700,
        margin: '0 0 1rem 0',
        color: 'var(--text)',
      }}
    >
      {title}
    </h2>
  )
}

function SectionError({ msg }: { msg: string }) {
  return (
    <div
      style={{
        color: '#fca5a5',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
      }}
    >
      {msg}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>{text}</p>
}

const statusColors: Record<string, string> = {
  active: '#6ee7b7',
  sold: '#93c5fd',
  hidden: '#94a3b8',
  new: '#818cf8',
  replied: '#6ee7b7',
  closed: '#94a3b8',
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span
      style={{
        fontSize: '0.72rem',
        fontWeight: 600,
        padding: '0.15rem 0.5rem',
        borderRadius: 9999,
        background: 'rgba(255,255,255,0.06)',
        color: statusColors[value] ?? 'var(--text-muted)',
        border: `1px solid ${statusColors[value] ?? 'var(--border)'}33`,
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </span>
  )
}

const divider: React.CSSProperties = {
  borderTop: '1px solid var(--border)',
  paddingTop: '2rem',
  marginTop: '2rem',
}



export default function SellerDashboardPage() {
  const { user, token, loading: authLoading } = useAuth()
  const activeToken = token ?? ''

  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [noStore, setNoStore] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [productsError, setProductsError] = useState<string | null>(null)
  const [productsLoading, setProductsLoading] = useState(false)

  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState<string | null>(null)

  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [groupsError, setGroupsError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    try {
      const data = await sellerService.getDashboard(activeToken)
      setDashboard(data)
      setDashboardError(null)
      setNoStore(false)
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 404) {
        setNoStore(true)
        setDashboard(null)
      } else {
        setDashboardError(err?.message ?? 'Failed to load dashboard')
      }
    }
  }

  const fetchProducts = async () => {
    setProductsLoading(true)
    try {
      const data = await productService.getSellerProducts(activeToken, { limit: 5 })
      setProducts(data.products.map(Product.fromDto))
      setProductsError(null)
    } catch (err: any) {
      setProductsError(err?.message ?? 'Failed to load products')
    } finally {
      setProductsLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const data = await sellerService.getMyProductGroups(activeToken)
      setGroups(data.map(ProductGroup.fromDto))
      setGroupsError(null)
    } catch (err: any) {
      setGroupsError(err?.message ?? 'Failed to load groups')
    }
  }

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const data = await orderService.listStoreOrders(activeToken, undefined, 1, 5)
      setOrders(data.items)
      setOrdersError(null)
    } catch (err: any) {
      setOrdersError(err?.message ?? 'Failed to load orders')
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    if (!activeToken || !user || user.role !== 'seller' || !user.selling_approve) return
    fetchDashboard()
    fetchProducts()
    fetchGroups()
    fetchOrders()

  }, [activeToken, user])



  if (authLoading) {
    return <div className="page-container">Loading…</div>
  }

  if (!user || user.role !== 'seller') {
    return <Navigate to="/" replace />
  }


  if (!user.selling_approve) {
    return (
      <div className="page-container" style={{ maxWidth: 560, textAlign: 'center' }}>
        <div
          style={{
            fontSize: '2.5rem',
            marginBottom: '1rem',
          }}
        >
          ⏳
        </div>
        <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.75rem', fontWeight: 800 }}>
          Pending Approval
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Your seller account is waiting for admin approval. Once approved, you will be able to
          create your store and start listing products.
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Check back later or contact support if this takes too long.
        </p>
      </div>
    )
  }


  if (noStore) {
    return (
      <div className="page-container" style={{ maxWidth: 560, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏪</div>
        <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.75rem', fontWeight: 800 }}>
          Create Your Store
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Your seller account is approved! Set up your store to start listing products and
          connecting with buyers.
        </p>
        <Link
          to="/store-settings"
          className="btn-primary btn-large"
          style={{ display: 'inline-block' }}
        >
          Create Store
        </Link>
      </div>
    )
  }

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>

      {}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 0.25rem', fontSize: '2rem', fontWeight: 800 }}>
            {dashboard?.store.name ?? 'Seller Dashboard'}
          </h1>
          {dashboard?.store.slug && (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              sellor.com/store/
              <strong style={{ color: 'var(--primary)' }}>{dashboard.store.slug}</strong>
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/seller/orders" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Manage Orders
          </Link>
          <Link to="/store-settings" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Manage Store
          </Link>
          <Link to="/products/new" className="btn-primary" style={{ textDecoration: 'none' }}>
            + Add Product
          </Link>
        </div>
      </div>

      {dashboardError && <SectionError msg={dashboardError} />}

      {}
      {dashboard && (
        <section>
          <SectionHeading title="Overview" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <StatCard label="Total products" value={dashboard.stats.total_products} />
            <StatCard label="Active products" value={dashboard.stats.active_products} />
            <StatCard label="Total inquiries" value={dashboard.stats.inquiries.total} />
            <StatCard label="New" value={dashboard.stats.inquiries.new} />
            <StatCard label="Replied" value={dashboard.stats.inquiries.replied} />
            <StatCard label="Closed" value={dashboard.stats.inquiries.closed} />
          </div>
        </section>
      )}

      {}
      <section style={divider}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <SectionHeading title="Recent orders" />
          <Link to="/seller/orders" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', textDecoration: 'none' }}>
            View all
          </Link>
        </div>
        {ordersError ? (
          <SectionError msg={ordersError} />
        ) : ordersLoading ? (
          <EmptyState text="Loading…" />
        ) : orders.length === 0 ? (
          <EmptyState text="No orders yet." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {orders.map((order) => (
              <div
                key={order.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  alignItems: 'center'
                }}
              >
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.9rem' }}>
                  #{order.id}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'} 
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem' }}>
                      by Buyer #{order.buyer_id}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Total: ฿{Number(order.total_amount).toLocaleString()} • {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge value={order.status.toLowerCase()} />
              </div>
            ))}
          </div>
        )}
      </section>

      {}
      <section style={divider}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <SectionHeading title="Recent inquiries" />
          <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
            View all
          </button>
        </div>
        {!dashboard ? (
          <EmptyState text="Loading…" />
        ) : dashboard.recent_inquiries.length === 0 ? (
          <EmptyState text="No inquiries yet." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {dashboard.recent_inquiries.map(Inquiry.fromDto).map((inq) => (
              <div
                key={inq.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '0.5rem 1rem',
                  padding: '0.75rem 1rem',
                  background: inq.isNew() ? 'rgba(129,140,248,0.05)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${inq.isNew() ? 'rgba(129,140,248,0.25)' : 'var(--border)'}`,
                  borderRadius: '0.5rem',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      marginBottom: '0.1rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inq.buyer_name}
                    {inq.product && (
                      <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                        {' '}on <em>{inq.product.title}</em>
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inq.message}
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.3rem',
                    flexShrink: 0,
                  }}
                >
                  <StatusBadge value={inq.status} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(inq.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {}
      <section style={divider}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <SectionHeading title="Products" />
          <Link to="/products" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', textDecoration: 'none' }}>
            Manage products
          </Link>
        </div>
        {productsError ? (
          <SectionError msg={productsError} />
        ) : productsLoading ? (
          <EmptyState text="Loading…" />
        ) : products.length === 0 ? (
          <EmptyState text="No products yet. Add your first product." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Title', 'Price', 'Stock', 'Status', 'Group'].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: 'left',
                        padding: '0.4rem 0.75rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const group = groups.find((g) => g.id === p.group_id)
                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td
                        style={{
                          padding: '0.55rem 0.75rem',
                          fontWeight: 600,
                          maxWidth: 240,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.title}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', whiteSpace: 'nowrap' }}>
                        ฿{p.formattedPrice()}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-muted)' }}>
                        {p.stock ?? '—'}
                      </td>
                      <td style={{ padding: '0.55rem 0.75rem' }}>
                        <StatusBadge value={p.status} />
                      </td>
                      <td
                        style={{
                          padding: '0.55rem 0.75rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.8rem',
                        }}
                      >
                        {group?.name ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {}
      <section style={divider}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <SectionHeading title="Product groups" />
          <Link to="/categories" className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', textDecoration: 'none' }}>
            Manage groups
          </Link>
        </div>
        {groupsError ? (
          <SectionError msg={groupsError} />
        ) : groups.length === 0 ? (
          <EmptyState text="No product groups yet." />
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {groups.map((g) => (
              <div
                key={g.id}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 9999,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontWeight: 600 }}>{g.name}</span>
                <span
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    color: '#818cf8',
                    fontSize: '0.72rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: 9999,
                    fontWeight: 700,
                  }}
                >
                  {g.product_count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
