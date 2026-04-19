import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../lib/services/authService'
import '../css/components.css'

import { CustomDropdown } from '../components/CustomDropdown'

export default function RegisterPage() {
  const nav = useNavigate()

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer')
  const [phone, setPhone] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const passwordMatch = password === confirmPassword && password.length > 0

  const allValid = hasMinLength && hasUppercase && hasNumber && passwordMatch;

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError('Please ensure your password meets all criteria.')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await authService.register(username, email, password, role, phone)
      nav('/login')
    } catch (err: any) {
      setError(err?.message ?? 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 570 }}>
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

      <h1 style={{ textAlign: 'center' }}>Create an Account</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Join SellorHub today to start buying and selling!
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

      <form onSubmit={onRegister}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="johndoe"
            />
          </div>

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            <span className={`validation-hint ${password.length === 0 ? '' : (hasMinLength ? 'valid' : 'invalid')}`}>
              {password.length === 0 ? '○' : (hasMinLength ? '✓' : '✗')} At least 8 characters
            </span>
            <span className={`validation-hint ${password.length === 0 ? '' : (hasUppercase ? 'valid' : 'invalid')}`}>
              {password.length === 0 ? '○' : (hasUppercase ? '✓' : '✗')} Contains uppercase letter
            </span>
            <span className={`validation-hint ${password.length === 0 ? '' : (hasNumber ? 'valid' : 'invalid')}`}>
              {password.length === 0 ? '○' : (hasNumber ? '✓' : '✗')} Contains a number
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <div className="password-input-wrapper">
            <input
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showConfirmPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {confirmPassword.length > 0 && (
            <span
              className={`validation-hint ${passwordMatch ? 'valid' : 'invalid'}`}
              style={{ marginTop: '0.5rem' }}
            >
              {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Phone number (optional)</label>
            <input
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="+1 234 567 890"
            />
          </div>

          <div className="form-group">
            <label className="form-label">I am a</label>
            <CustomDropdown
              value={role}
              onChange={(val) => setRole(val as 'buyer' | 'seller')}
              options={[
                { value: 'buyer', label: 'Buyer' },
                { value: 'seller', label: 'Seller' }
              ]}
              placeholder="Select role"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary btn-large"
          disabled={submitting || !allValid}
          style={{ width: '100%', marginTop: '1rem', opacity: (!allValid && password.length > 0) ? 0.7 : 1 }}
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.875rem' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}