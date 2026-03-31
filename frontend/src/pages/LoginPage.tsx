import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const nav = useNavigate()
  const { setToken, refreshMe } = useAuth()

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await login(email, password)
      setToken(res.access_token)
      await refreshMe()
      nav('/me')
    } catch (err: any) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', padding: 16 }}>
      <h1 style={{ marginBottom: 20 }}>Sellor</h1>

      {error && (
        <div
          style={{
            color: 'crimson',
            background: 'rgba(220,20,60,0.08)',
            padding: 10,
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={onLogin} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span>Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{ padding: 10 }}
          />
        </label>

        <button type="submit" disabled={submitting} style={{ padding: 10, fontWeight: 600 }}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}