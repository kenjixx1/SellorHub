import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../lib/auth'

export default function RegisterPage() {
  const nav = useNavigate()

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const [phone, setPhone] = useState('')

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await register(username, email, password, role, phone)
      nav('/login')
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', padding: 16 }}>
      <h1 style={{ marginBottom: 20 }}>Create account</h1>

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

      <form onSubmit={onRegister} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ padding: 10 }}
          />
        </label>

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

        <label style={{ display: 'grid', gap: 4 }}>
          <span>Phone number (optional)</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            style={{ padding: 10 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 4 }}>
          <span>I am a</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'buyer' | 'seller')}
            style={{ padding: 10 }}
          >
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
        </label>

        <button type="submit" disabled={submitting} style={{ padding: 10, fontWeight: 600 }}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  )
}