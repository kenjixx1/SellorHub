import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getMyProductGroups,
  createProduct,
  uploadProductImage,
  type ProductGroup,
  type ProductStatus
} from '../lib/seller'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImageSlot {
  file: File | null
  imageUrl: string         // for URL upload
  preview: string | null   // object URL for preview (if file selected)
  dragOver: boolean
}

const MAX_IMAGES = 5

function createEmptySlot(): ImageSlot {
  return { file: null, imageUrl: '', preview: null, dragOver: false }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateProductPage() {
  const { user, token, loading: authLoading } = useAuth()
  const activeToken = token ?? ''
  const navigate = useNavigate()

  const [groups, setGroups] = useState<ProductGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  // Form Fields
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [stock, setStock] = useState('')
  const [status, setStatus] = useState<ProductStatus>('active')
  const [groupId, setGroupId] = useState<string>('')

  // Carousel State
  const [slots, setSlots] = useState<ImageSlot[]>(
    Array.from({ length: MAX_IMAGES }, createEmptySlot)
  )
  const [currentIndex, setCurrentIndex] = useState(0)

  // Hidden file inputs — one per slot
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>(Array(MAX_IMAGES).fill(null))

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

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      slots.forEach(s => { if (s.preview) URL.revokeObjectURL(s.preview) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (authLoading || loadingGroups) return <div className="page-container">Loading…</div>

  if (!user || user.role !== 'seller') return <Navigate to="/" replace />
  if (!user.selling_approve) return <Navigate to="/seller" replace />

  // ── Slot helpers ─────────────────────────────────────────────────────────────

  function assignFile(index: number, file: File) {
    // Revoke old preview if any
    const old = slots[index].preview
    if (old) URL.revokeObjectURL(old)

    const preview = URL.createObjectURL(file)
    setSlots(prev => {
      const next = [...prev]
      next[index] = { ...next[index], file, preview, imageUrl: '', dragOver: false }
      return next
    })
  }

  function updateImageUrl(index: number, url: string) {
    setSlots(prev => {
      const next = [...prev]
      next[index] = { ...next[index], imageUrl: url }
      return next
    })
  }

  function removeSlot(index: number) {
    const old = slots[index].preview
    if (old) URL.revokeObjectURL(old)
    // Reset the hidden input value
    const inp = fileInputRefs.current[index]
    if (inp) inp.value = ''
    setSlots(prev => {
      const next = [...prev]
      next[index] = createEmptySlot()
      return next
    })
  }

  function handleFileChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) assignFile(index, file)
  }

  function handleDrop(index: number, e: React.DragEvent) {
    e.preventDefault()
    setSlots(prev => { const n = [...prev]; n[index] = { ...n[index], dragOver: false }; return n })
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) assignFile(index, file)
  }

  function setDragOver(index: number, value: boolean) {
    setSlots(prev => { const n = [...prev]; n[index] = { ...n[index], dragOver: value }; return n })
  }

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
      throw new Error(`Failed to download image from URL: ${url}. The image host might block direct downloads (CORS restriction). Please use the 'Upload File' option instead.`)
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────────

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

      // 2. Upload images sequentially (only filled slots)
      const filledSlots = slots
        .map((s, i) => ({ slot: s, position: i }))
        .filter(({ slot }) => slot.file !== null || slot.imageUrl.trim() !== '')

      for (let i = 0; i < filledSlots.length; i++) {
        const { slot, position } = filledSlots[i]
        setUploadProgress(`Uploading image ${i + 1} of ${filledSlots.length}…`)
        
        let fileToUpload = slot.file

        // If they provided a URL but no file, try fetching it
        if (!fileToUpload && slot.imageUrl) {
          fileToUpload = await fetchImageAsFile(slot.imageUrl)
        }

        if (fileToUpload) {
          await uploadProductImage(activeToken, newProduct.id, fileToUpload, position)
        }
      }

      // Success, go back to dashboard
      navigate('/seller')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create product.')
      setSubmitting(false)
      setUploadProgress(null)
    }
  }

  const filledCount = slots.filter(s => s.file !== null || s.imageUrl.trim() !== '').length
  const currentSlot = slots[currentIndex]

  // ── Render ────────────────────────────────────────────────────────────────────

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

        {/* ── Slideshow-Style Multi-Image Uploader ─────────────────────────── */}
        <div style={{ 
          marginTop: '1rem', 
          padding: '1.5rem', 
          border: '1px solid var(--border)', 
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Product Images</h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Up to 5 images. The first slot (position 0) is the cover thumbnail.
              </p>
            </div>
            <span style={{
              fontSize: '0.8rem',
              color: filledCount > 0 ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 500,
            }}>
              {filledCount} / {MAX_IMAGES} selected
            </span>
          </div>

          <div className="carousel-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Carousel Header (Arrows) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} 
                disabled={currentIndex === 0 || submitting} 
                className="btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', opacity: currentIndex === 0 ? 0.3 : 1 }}
              >
                ◀ Prev
              </button>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: currentIndex === 0 ? 'var(--accent)' : 'inherit' }}>
                 {currentIndex === 0 ? '★ Cover Image' : `Image ${currentIndex + 1} of ${MAX_IMAGES}`}
              </div>
              <button 
                type="button" 
                onClick={() => setCurrentIndex(Math.min(MAX_IMAGES - 1, currentIndex + 1))} 
                disabled={currentIndex === MAX_IMAGES - 1 || submitting} 
                className="btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', opacity: currentIndex === MAX_IMAGES - 1 ? 0.3 : 1 }}
              >
                Next ▶
              </button>
            </div>

            {/* Center Panel (Image Preview / Add Zone) */}
            <div style={{ 
              aspectRatio: '16/9', 
              border: '1px solid var(--border)', 
              borderRadius: '0.5rem', 
              overflow: 'hidden', 
              position: 'relative', 
              background: 'rgba(255,255,255,0.02)', 
              display: 'flex', 
              flexDirection: 'column' 
            }}>
              {currentSlot.preview || currentSlot.imageUrl ? (
                <>
                   <img 
                     src={currentSlot.preview || currentSlot.imageUrl} 
                     alt={`Preview slot ${currentIndex}`} 
                     style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                   />
                   {!submitting && (
                     <button 
                       type="button" 
                       onClick={() => removeSlot(currentIndex)} 
                       style={{ 
                         position: 'absolute', 
                         top: '10px', 
                         right: '10px', 
                         background: 'rgba(0,0,0,0.7)', 
                         color: 'white', 
                         border: '1px solid rgba(255,255,255,0.2)', 
                         borderRadius: '0.3rem', 
                         padding: '0.4rem 0.8rem', 
                         cursor: 'pointer',
                         fontSize: '0.8rem'
                       }}
                     >
                       Remove
                     </button>
                   )}
                </>
              ) : (
                <div style={{ 
                  padding: '1.5rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%', 
                  gap: '1rem',
                  overflowY: 'auto'
                }}>
                   {/* Drag and Drop Zone */}
                   <div 
                     onDragOver={(e) => { e.preventDefault(); setDragOver(currentIndex, true) }}
                     onDragLeave={() => setDragOver(currentIndex, false)}
                     onDrop={(e) => { !submitting && handleDrop(currentIndex, e) }}
                     onClick={() => !submitting && fileInputRefs.current[currentIndex]?.click()}
                     style={{ 
                       flex: 1, 
                       width: '100%', 
                       display: 'flex', 
                       flexDirection: 'column', 
                       alignItems: 'center', 
                       justifyContent: 'center', 
                       border: `2px dashed ${currentSlot.dragOver ? 'var(--accent)' : 'var(--border)'}`, 
                       borderRadius: '0.5rem', 
                       cursor: submitting ? 'not-allowed' : 'pointer', 
                       background: currentSlot.dragOver ? 'rgba(var(--accent-rgb, 139,92,246),0.08)' : 'transparent', 
                       transition: 'all 0.2s', 
                       minHeight: '120px' 
                     }}
                   >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Click or drag a file here</span>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '1rem' }}>
                      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>OR</span>
                      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                   </div>

                   {/* Upload By URL */}
                   <div style={{ width: '100%' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.3rem' }}>Upload by URL</label>
                      <input 
                        type="url" 
                        className="form-input" 
                        value={currentSlot.imageUrl} 
                        onChange={(e) => updateImageUrl(currentIndex, e.target.value)} 
                        placeholder="https://example.com/image.jpg" 
                        disabled={submitting}
                      />
                   </div>
                </div>
              )}
            </div>

            {/* Hidden File Inputs per Slot */}
            {slots.map((_, i) => (
                <input
                  key={i}
                  ref={el => { fileInputRefs.current[i] = el }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileChange(i, e)}
                  disabled={submitting}
                />
            ))}

            {/* Dots Indicator */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
               {slots.map((s, i) => (
                  <div 
                    key={i} 
                    onClick={() => !submitting && setCurrentIndex(i)} 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: currentIndex === i ? 'var(--accent)' : (s.file || s.imageUrl ? 'var(--text)' : 'var(--border)'), 
                      cursor: submitting ? 'not-allowed' : 'pointer', 
                      opacity: currentIndex === i ? 1 : (s.file || s.imageUrl ? 0.8 : 0.4), 
                      transition: 'all 0.2s',
                      boxShadow: currentIndex === i ? '0 0 0 2px rgba(var(--accent-rgb, 139,92,246), 0.3)' : 'none'
                    }} 
                    title={`Slot ${i} ${s.file || s.imageUrl ? '(filled)' : '(empty)'}`}
                  />
               ))}
            </div>

          </div>

          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Accepted formats: JPEG, PNG, WebP · Max 5 MB per image
          </p>
        </div>

        {/* Upload progress feedback */}
        {uploadProgress && (
          <div style={{
            color: 'var(--accent)',
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            {uploadProgress}
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={submitting}
          >
            {submitting 
              ? uploadProgress ?? 'Creating Product…' 
              : `Publish Product${filledCount > 0 ? ` (${filledCount} image${filledCount > 1 ? 's' : ''})` : ''}`}
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
