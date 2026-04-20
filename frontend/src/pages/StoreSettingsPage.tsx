import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { sellerService } from '../lib/services/sellerService'
import { storeService } from '../lib/services/storeService'
import { ApiError } from '../lib/api'

function generateCandidateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const buf = new Uint8Array(8)
  crypto.getRandomValues(buf)
  const suffix = Array.from(buf)
    .map((b) => chars[b % chars.length])
    .join('')
  return `store-${suffix}`
}

export default function StoreSettingsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const activeToken = token ?? ''
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  

  const [isEdit, setIsEdit] = useState(false)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('')

  const [submitting, setSubmitting] = useState(false)
  

  const [slugTouched, setSlugTouched] = useState(false)
  const isValidSlug =
    /^[a-z0-9-]+$/.test(slug) &&
    slug.length >= 3 &&
    !slug.startsWith('-') &&
    !slug.endsWith('-')

  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [generating, setGenerating] = useState(false)
  const lastCheckedSlug = useRef<string>('')

  useEffect(() => {
    if (!activeToken || !user || user.role !== 'seller' || !user.selling_approve) return

    async function init() {
      try {
        const dashboard = await sellerService.getDashboard(activeToken)

        const profile = await storeService.getProfile(dashboard.store.slug)
        setIsEdit(true)
        setName(profile.name)
        setSlug(profile.slug)
        setDescription(profile.description || '')
        setLogoUrl(profile.logo_url || '')
        setLoading(false)
      } catch (err: any) {
        if (err instanceof ApiError && err.status === 404) {

          setIsEdit(false)
          setLoading(false)
        } else {
          setError(err?.message ?? 'Failed to load store data')
          setLoading(false)
        }
      }
    }
    
    init()
  }, [activeToken, user])

  if (authLoading || loading) {
    return <div className="page-container">Loading…</div>
  }

  if (!user || user.role !== 'seller') {
    return <Navigate to="/" replace />
  }
  
  if (!user.selling_approve) {
    return (
      <div className="page-container" style={{ textAlign: 'center' }}>
        <h2>Pending Approval</h2>
        <p>You must be approved to manage a store.</p>
      </div>
    )
  }

  const handleSlugBlur = async () => {
    if (!isValidSlug || slug === lastCheckedSlug.current) return
    lastCheckedSlug.current = slug
    try {
      const result = await storeService.checkSlug(slug)
      setSlugAvailable(result.available)
    } catch {
      setSlugAvailable(null)
    }
  }

  const handleGenerateSlug = async () => {
    setGenerating(true)
    setSlugAvailable(null)
    try {
      for (let i = 0; i < 10; i++) {
        const candidate = generateCandidateSlug()
        const result = await storeService.checkSlug(candidate)
        if (result.valid && result.available) {
          setSlug(candidate)
          setSlugTouched(true)
          setSlugAvailable(true)
          lastCheckedSlug.current = candidate
          return
        }
      }
      setError('Could not find an available slug. Please try again.')
    } catch {
      setError('Failed to generate a slug. Please try manually.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isEdit && !isValidSlug) {
      setError('Invalid slug format.')
      return
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        await storeService.update(activeToken, {
          name,
          description: description || undefined,
          logo_url: logoUrl || undefined,
        })
      } else {
        await storeService.create(activeToken, {
          name,
          slug,
          description: description || undefined,
          logo_url: logoUrl || undefined,
        })
      }
      navigate('/seller')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save store.')
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem', fontWeight: 700 }}>
          {isEdit ? 'Store Settings' : 'Create Your Store'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {isEdit 
            ? 'Update your store details to keep buyers informed.' 
            : 'Set up your unique store profile so buyers can find you.'}
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
        <div className="form-group">
          <label className="form-label">Store Name</label>
          <input 
            type="text" 
            className="form-input" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Nisa's Handmade Jewelry"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Store URL / Slug</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugTouched(true)
                setSlugAvailable(null)
              }}
              onBlur={!isEdit ? handleSlugBlur : undefined}
              disabled={isEdit}
              required
              placeholder="e.g., nisa-jewelry"
              style={{ flex: 1 }}
            />
            {!isEdit && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleGenerateSlug}
                disabled={generating}
                style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {generating ? 'Generating…' : 'Generate slug'}
              </button>
            )}
          </div>
          {!isEdit && (
            <>
              <p className={`validation-hint ${slugTouched ? (isValidSlug ? 'valid' : 'invalid') : ''}`}>
                Only lowercase letters, numbers, and hyphens (min 3 chars). Cannot be changed later.
                {slugTouched && !isValidSlug && ' Invalid format.'}
              </p>
              {slugTouched && isValidSlug && slugAvailable === true && (
                <p className="validation-hint valid">Slug is available.</p>
              )}
              {slugTouched && isValidSlug && slugAvailable === false && (
                <p className="validation-hint invalid">Slug is already taken.</p>
              )}
            </>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea 
            className="form-input" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Tell buyers about your shop, what you sell, and your story..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">Logo URL</label>
          <input 
            type="url" 
            className="form-input" 
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
          />
          {logoUrl && (
            <div style={{ marginTop: '0.75rem', width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={logoUrl} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={submitting || (!isEdit && !isValidSlug) || (!isEdit && slugAvailable === false)}
          >
            {submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Store')}
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => navigate('/seller')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
