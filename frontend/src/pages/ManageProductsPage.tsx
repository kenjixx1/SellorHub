import { useEffect, useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { sellerService } from '../lib/services/sellerService'
import { productService } from '../lib/services/productService'
import { Product } from '../lib/models/Product'
import { ProductGroup } from '../lib/models/ProductGroup'

export default function ManageProductsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const activeToken = token ?? ''

  const [products, setProducts] = useState<Product[]>([])
  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const g = await sellerService.getMyProductGroups(activeToken)
      setGroups(g.map(ProductGroup.fromDto))
      const p = await productService.getSellerProducts(activeToken, { limit: 100 })
      setProducts(p.products.map(Product.fromDto))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!activeToken || !user || user.role !== 'seller') return
    fetchItems()
  }, [activeToken, user])

  if (authLoading || loading) return <div className="page-container">Loading…</div>
  if (!user || user.role !== 'seller') return <Navigate to="/" replace />

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return
    
    try {
      await productService.delete(activeToken, id)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err: any) {
      alert(err?.message ?? 'Failed to delete product')
    }
  }

  const getGroupName = (groupId?: number | null) => {
    if (!groupId) return '—'
    return groups.find(g => g.id === groupId)?.name ?? '—'
  }

  const statusColors: Record<string, string> = {
    active: '#6ee7b7',
    sold: '#93c5fd',
    hidden: '#94a3b8',
  }

  return (
    <div className="page-container" style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
           <h1 style={{ marginBottom: '0.25rem', fontSize: '2rem', fontWeight: 700 }}>Manage Products</h1>
           <p style={{ color: 'var(--text-muted)' }}>View, edit, and manage your entire store inventory.</p>
        </div>
        <Link to="/products/new" className="btn-primary" style={{ textDecoration: 'none' }}>
           + Add Product
        </Link>
      </div>

      {error ? (
        <div style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
          {error}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.02)' }}>
           <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You don't have any products yet.</p>
           <Link to="/products/new" className="btn-secondary" style={{ textDecoration: 'none' }}>Add your first product</Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Product</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Price</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Stock</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     {p.primaryImage() ? (
                       <div style={{ width: 40, height: 40, borderRadius: 4, overflow: 'hidden', background: '#000' }}>
                         <img src={p.primaryImage()!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       </div>
                     ) : (
                       <div style={{ width: 40, height: 40, borderRadius: 4, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                         📸
                       </div>
                     )}
                     <span style={{ fontWeight: 600 }}>{p.title}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>฿{p.formattedPrice()}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{p.stock ?? 'Unlimited'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                     <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 9999, background: 'rgba(255,255,255,0.06)', color: statusColors[p.status] ?? 'var(--text-muted)', border: `1px solid ${statusColors[p.status] ?? 'var(--border)'}33` }}>
                       {p.status}
                     </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{getGroupName(p.group_id)}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                     <Link to={`/products/${p.id}/edit`} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', marginRight: '0.5rem', textDecoration: 'none' }}>Edit</Link>
                     <button className="btn-logout" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', borderRadius: '9999px' }} onClick={() => handleDelete(p.id, p.title)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
