import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../lib/services/authService'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const nav = useNavigate()
  const { setToken, refreshMe } = useAuth()

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await authService.login(email, password)
      setToken(res.access_token)
      await refreshMe(res.access_token)
      const destination =
        res.user.role === 'admin'
          ? '/admin'
          : res.user.role === 'seller'
          ? '/seller'
          : '/me'
      nav(destination)
    } catch (err: any) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 480 }}>
      <button 
        onClick={() => nav(-1)} 
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
        Back
      </button>

      <h1 style={{ textAlign: 'center' }}>Welcome Back</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Log in to continue to SellorHub
      </p>

      {error && (
        <div
          style={{
            color: '#fca5a5',
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={onLogin}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="password-input-wrapper">
            <input
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary btn-large"
          disabled={submitting}
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          Sign up
        </Link>
      </p>
    </div>
  )
}