import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getMyProductGroups,
  createProduct,
  uploadProductImage,
  type ProductGroup,
  type ProductStatus
} from '../lib/seller'

export default function CreateProductPage() {
  const { user, token, loading: authLoading } = useAuth()
  const activeToken = token ?? ''
  const navigate = useNavigate()

  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form Fields
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [stock, setStock] = useState('')
  const [status, setStatus] = useState<ProductStatus>('active')
  const [groupId, setGroupId] = useState<string>('')

  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => {
    if (!activeToken || !user || user.role !== 'seller' || !user.selling_approve) return
    
    async function loadGroups() {
      try {
        const data = await getMyProductGroups(activeToken)
        setGroups(data)
      } catch (err) {
        // Soft error, just log. The select will just be empty.
        console.error('Failed to load groups', err)
      } finally {
        setLoadingGroups(false)
      }
    }
    loadGroups()
  }, [activeToken, user])

  if (authLoading || loadingGroups) return <div className="page-container">Loading…</div>

  if (!user || user.role !== 'seller') return <Navigate to="/" replace />
  if (!user.selling_approve) return <Navigate to="/seller" replace />

  const fetchImageAsFile = async (url: string): Promise<File> => {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const blob = await response.blob()
      
      // Determine extension from content-type or fallback to jpg
      let ext = 'jpg'
      if (blob.type.includes('png')) ext = 'png'
      if (blob.type.includes('webp')) ext = 'webp'
      
      return new File([blob], `product-image.${ext}`, { type: blob.type })
    } catch (err) {
      throw new Error("Failed to download image from URL. The image host might block direct downloads (CORS restriction). Please use the 'Upload File' option instead.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic validation
    if (!title || !price || isNaN(Number(price))) {
      setError('Please provide a valid title and price.')
      return
    }

    setSubmitting(true)

    try {
      // 1. Create the product first
      const valGroupId = groupId ? Number(groupId) : null
      const valStock = stock ? Number(stock) : null
      
      const newProduct = await createProduct(activeToken, {
        title,
        price: Number(price),
        description: description || undefined,
        stock: valStock,
        status,
        group_id: valGroupId,
      })

      // 2. Upload image if available
      let fileToUpload = imageFile

      // If they provided a URL but no file, try fetching it
      if (imageUrl && !fileToUpload) {
        fileToUpload = await fetchImageAsFile(imageUrl)
      }

      if (fileToUpload) {
        await uploadProductImage(activeToken, newProduct.id, fileToUpload, 0)
      }

      // Success, go back to dashboard
      navigate('/seller')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create product.')
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700 }}>
          Create New Product
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Add a new item to your store inventory.
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
              placeholder="e.g., Handcrafted Silver Bracelet"
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
              placeholder="0.00"
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
            placeholder="Describe the product details, materials, size, etc..."
          />
        </div>

        {/* Categories and Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Category / Group</label>
            <select 
              className="form-input"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
            >
              <option value="">-- Uncategorized --</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
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

        {/* Image Upload Area */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '1.5rem', 
          border: '1px solid var(--border)', 
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Product Image</h3>
          
          <div className="form-group">
            <label className="form-label">Upload by URL</label>
            <input 
              type="url" 
              className="form-input" 
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={!!imageFile}
            />
            {imageUrl && !imageFile && (
              <p className="validation-hint" style={{ color: 'var(--text-muted)' }}>
                We will try to download this image. If it fails due to server rules, use file upload below.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
            <span style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>OR</span>
            <span style={{ flex: 1, height: '1px', background: 'var(--border)' }}></span>
          </div>

          <div className="form-group">
            <label className="form-label">Upload File (Supported: JPG, PNG, WebP)</label>
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setImageFile(e.target.files[0])
                  setImageUrl('') // clear URL if file picked
                } else {
                  setImageFile(null)
                }
              }}
              style={{ color: 'var(--text)' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={submitting}
          >
            {submitting ? 'Creating Product & Uploading Image...' : 'Publish Product'}
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            disabled={submitting}
            onClick={() => navigate('/seller')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
