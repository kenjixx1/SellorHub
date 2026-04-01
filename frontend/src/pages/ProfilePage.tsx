import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../lib/api'

export default function ProfilePage() {
  const { user, refreshMe, token } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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
      // Backend note: Verify if there is a PUT /api/auth/me or similar. 
      // If not, this is a placeholder for the user's intent to "edit page".
      // Assuming a standard user update endpoint might exist or be needed.
      await apiFetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          phone_number: phoneNumber || null
        }),
        token
      })
      await refreshMe()
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className="page-container">Please log in to view your profile.</div>

  return (
    <div className="page-container" style={{ maxWidth: '600px' }}>
      <h1>Edit Profile</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Update your personal information and contact details.
      </p>

      {message && (
        <div className={`validation-hint ${message.type === 'success' ? 'valid' : 'invalid'}`} style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          {message.text}
        </div>
      )}

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
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.1)', borderRadius: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem', border: '1px solid var(--border)' }}>
            {user.role.toUpperCase()}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Role cannot be changed after registration.</p>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2rem' }} disabled={loading}>
          {loading ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
