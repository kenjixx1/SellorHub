import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { sellerService } from '../lib/services/sellerService'
import { productService } from '../lib/services/productService'
import type { ProductGroup, ProductStatus } from '../lib/types'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const { user, token, loading: authLoading } = useAuth()
  const activeToken = token ?? ''
  const navigate = useNavigate()

  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form Fields
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [stock, setStock] = useState('')
  const [status, setStatus] = useState<ProductStatus>('active')
  const [groupId, setGroupId] = useState<string>('')
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)

  useEffect(() => {
    if (!activeToken || !user || user.role !== 'seller') return
    
    async function init() {
      try {
        const productGroups = await sellerService.getMyProductGroups(activeToken)
        setGroups(productGroups)

        if (id) {
           const p = await productService.getById(Number(id))
           setTitle(p.title)
           setPrice(String(p.price))
           setDescription(p.description || '')
           setStock(p.stock != null ? String(p.stock) : '')
           setStatus(p.status)
           setGroupId(p.group_id ? String(p.group_id) : '')
        }
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load product data')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [activeToken, user, id])

  if (authLoading || loading) return <div className="page-container">Loading…</div>
  if (!user || user.role !== 'seller') return <Navigate to="/" replace />

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title || !price || isNaN(Number(price))) {
      setError('Please provide a valid title and price.')
      return
    }

    setSubmitting(true)

    try {
      const valGroupId = groupId ? Number(groupId) : null
      const valStock = stock ? Number(stock) : null
      
      await productService.update(activeToken, Number(id), {
        title,
        price: Number(price),
        description: description || null,
        stock: valStock,
        status,
        group_id: valGroupId,
      })

      navigate('/products')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update product.')
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700 }}>
          Edit Product
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Update the details of your inventory item.
        </p>
      </div>

      {error && (
        <div style={{
          color: '#fca5a5',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Core Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Product Title *</label>
            <input 
              type="text" 
              className="form-input" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Price (฿) *</label>
            <input 
              type="number" 
              step="0.01"
              min="0"
              className="form-input" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Stock Quantity</label>
            <input 
              type="number" 
              min="0"
              className="form-input" 
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="Leave blank if unlimited"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea 
            className="form-input" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* Categories and Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Category / Group</label>
              <Link to="/categories" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Manage Categories</Link>
            </div>
            
            {isCreatingGroup ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ flex: 1, padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}
                  placeholder="Category Name" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  autoFocus
                />
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}
                  onClick={async () => {
                    if (!newGroupName.trim()) {
                      setIsCreatingGroup(false)
                      return
                    }
                    setCreatingGroup(true)
                    try {
                      const created = await sellerService.createProductGroup(activeToken, newGroupName.trim())
                      setGroups(prev => [...prev, created])
                      setGroupId(String(created.id))
                      setIsCreatingGroup(false)
                      setNewGroupName('')
                    } catch (err: any) {
                      alert(err?.message ?? 'Failed to create category')
                    } finally {
                      setCreatingGroup(false)
                    }
                  }}
                  disabled={creatingGroup}
                >
                  {creatingGroup ? '...' : 'Add'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px' }}
                  onClick={() => setIsCreatingGroup(false)}
                  disabled={creatingGroup}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  className="form-input"
                  style={{ flex: 1 }}
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  <option value="">-- Uncategorized --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ padding: '0', width: '42px', flexShrink: 0, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => setIsCreatingGroup(true)}
                  title="Create new category"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select 
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
            >
              <option value="active">Active (Visible)</option>
              <option value="hidden">Hidden</option>
              <option value="sold">Sold Out</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            disabled={submitting}
            onClick={() => navigate('/products')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
