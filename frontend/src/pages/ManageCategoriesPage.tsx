import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { sellerService } from '../lib/services/sellerService'
import { ProductGroup } from '../lib/models/ProductGroup'

export default function ManageCategoriesPage() {
  const { user, token, loading: authLoading } = useAuth()
  const activeToken = token ?? ''

  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  useEffect(() => {
    if (!activeToken || !user || user.role !== 'seller') return
    loadGroups()
  }, [activeToken, user])

  async function loadGroups() {
    setLoading(true)
    setError(null)
    try {
      const data = await sellerService.getMyProductGroups(activeToken)
      setGroups(data.map(ProductGroup.fromDto))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) return <div className="page-container">Loading categories…</div>
  if (!user || user.role !== 'seller') return <Navigate to="/" replace />

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await sellerService.createProductGroup(activeToken, newName.trim())
      setGroups(prev => [...prev, ProductGroup.fromDto(created)])
      setNewName('')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRename = async (groupId: number) => {
    if (!editingName.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const updated = await sellerService.updateProductGroup(activeToken, groupId, editingName.trim())
      setGroups(prev => prev.map(g => g.id === groupId ? ProductGroup.fromDto(updated) : g))
      setEditingId(null)
      setEditingName('')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update category')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (groupId: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? Products in this category will become uncategorized.`)) return
    setSubmitting(true)
    setError(null)
    try {
      await sellerService.deleteProductGroup(activeToken, groupId)
      setGroups(prev => prev.filter(g => g.id !== groupId))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete category')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/seller" className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Manage Categories</h1>
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

      {/* Quick Add form */}
      <div style={{ 
        padding: '1.5rem', 
        background: 'rgba(255,255,255,0.02)', 
        border: '1px solid var(--border)', 
        borderRadius: '1rem', 
        marginBottom: '2rem' 
      }}>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 1rem', fontWeight: 700 }}>Create New Category</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem' }}>
          <input 
            type="text" 
            className="form-input" 
            style={{ flex: 1 }}
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            placeholder="Category name (e.g. Vintage Watches)"
            disabled={submitting}
          />
          <button type="submit" className="btn-primary" disabled={submitting || !newName.trim()}>
            {submitting ? 'Creating...' : 'Add Category'}
          </button>
        </form>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ 
           display: 'flex', 
           padding: '0 1rem', 
           fontSize: '0.8rem', 
           color: 'var(--text-muted)', 
           fontWeight: 600, 
           textTransform: 'uppercase', 
           letterSpacing: '0.05em' 
        }}>
          <div style={{ flex: 1 }}>Name</div>
          <div style={{ width: 100, textAlign: 'center' }}>Products</div>
          <div style={{ width: 140, textAlign: 'right' }}>Actions</div>
        </div>

        {groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--glass)', borderRadius: '1rem', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            No categories yet. Create one above to start organizing your shop!
          </div>
        ) : (
          groups.map((group) => (
            <div 
              key={group.id} 
              style={{ 
                background: 'var(--glass)', 
                padding: '1rem', 
                borderRadius: '0.75rem', 
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ flex: 1 }}>
                {editingId === group.id ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', flex: 1 }}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px' }}
                      onClick={() => handleRename(group.id)}
                      disabled={submitting}
                    >
                      Save
                    </button>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px' }}
                      onClick={() => { setEditingId(null); setEditingName(''); }}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{group.name}</div>
                )}
              </div>
              
              <div style={{ width: 100, textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {group.product_count}
              </div>

              <div style={{ width: 140, textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                {editingId !== group.id && (
                  <>
                    <button 
                      className="btn-link" 
                      style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                      onClick={() => { setEditingId(group.id); setEditingName(group.name); }}
                      disabled={submitting}
                    >
                      Rename
                    </button>
                    <button 
                      className="btn-link" 
                      style={{ color: '#f87171', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                      onClick={() => handleDelete(group.id, group.name)}
                      disabled={submitting}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Tip: Categories help buyers browse your store. You can assign products to these categories in the Product Edit page.
      </p>
    </div>
  )
}
