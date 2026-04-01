import { useRef, useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiFetch, apiUpload, API_BASE_URL } from '../lib/api'
import type { User } from '../lib/auth'

function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}

export default function ProfilePage() {
  const { user, refreshMe, token } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setUsername(user.username)
      setEmail(user.email)
      setPhoneNumber(user.phone_number || '')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await apiFetch<User>('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          phone_number: phoneNumber || null,
        }),
        token,
      })
      await refreshMe()
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setMessage(null)
    try {
      const form = new FormData()
      form.append('file', file)
      await apiUpload<User>('/api/users/me/avatar', form, token)
      await refreshMe()
      setMessage({ type: 'success', text: 'Avatar updated!' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Avatar upload failed' })
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!user) return <div className="page-container">Please log in to view your profile.</div>

  const avatarSrc = resolveAvatarUrl(user.avatar_url)

  return (
    <div className="page-container" style={{ maxWidth: '600px' }}>
      <h1>Edit Profile</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Update your personal information and contact details.
      </p>

      {message && (
        <div
          className={`validation-hint ${message.type === 'success' ? 'valid' : 'invalid'}`}
          style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
        >
          {message.text}
        </div>
      )}

      {/* Avatar section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: '700',
            color: '#fff',
            flexShrink: 0,
            border: '2px solid var(--border)',
          }}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user.username.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <button
            type="button"
            className="btn-primary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            disabled={avatarUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarUploading ? 'Uploading...' : 'Change Avatar'}
          </button>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            JPEG, PNG, or WebP. Max ~5 MB.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Phone Number (Optional)</label>
          <input
            type="tel"
            className="form-input"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+66..."
          />
        </div>

        <div className="form-group" style={{ marginTop: '2rem' }}>
          <label className="form-label">Account Role</label>
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '0.5rem',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              border: '1px solid var(--border)',
            }}
          >
            {user.role.toUpperCase()}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Role cannot be changed after registration.
          </p>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2rem' }} disabled={loading}>
          {loading ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
