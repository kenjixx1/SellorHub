import { useRef, useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { API_BASE_URL } from '../lib/api'
import { userService } from '../lib/services/userService'
import { addressService } from '../lib/services/addressService'
import type { AddressResponse } from '../lib/types'
import { Address } from '../lib/models'

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

  const [addresses, setAddresses] = useState<Address[]>([])
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressForm, setAddressForm] = useState<Partial<AddressResponse>>({
    label: '',
    recipient_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Thailand',
    is_default: false,
  })

  useEffect(() => {
    if (user) {
      setUsername(user.username)
      setEmail(user.email)
      setPhoneNumber(user.phone_number || '')
      fetchAddresses()
    }
  }, [user])

  const fetchAddresses = async () => {
    try {
      if (!token) return
      const data = await addressService.getAll(token)
      setAddresses(data.map(Address.fromDto))
    } catch (err) {
      console.error('Failed to fetch addresses:', err)
    }
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!token) throw new Error('No token')
      if (editingAddress) {
        await addressService.update(token, editingAddress.id, addressForm)
      } else {
        await addressService.create(token, addressForm as any)
      }
      await fetchAddresses()
      setIsAddingAddress(false)
      setEditingAddress(null)
      setAddressForm({
        label: '',
        recipient_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        province: '',
        postal_code: '',
        country: 'Thailand',
        is_default: false,
      })
      setMessage({ type: 'success', text: 'AddressResponse saved!' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save address' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      if (!token) return
      await addressService.delete(token, id)
      await fetchAddresses()
    } catch (err) {
      setMessage({ type: 'error', text: 'Delete failed' })
    }
  }

  const handleSetDefault = async (id: number) => {
    try {
      if (!token) return
      await addressService.setDefault(token, id)
      await fetchAddresses()
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to set default address' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      if (!token) return
      await userService.updateProfile(token, {
        username,
        email,
        phone_number: phoneNumber || null,
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
      if (!token) return
      await userService.uploadAvatar(token, file)
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

      {}
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
          <label className="form-label">Email AddressResponse</label>
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

        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Shipping Addresses
            {!isAddingAddress && !editingAddress && (
              <button
                type="button"
                className="nav-link"
                style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.75rem' }}
                onClick={() => setIsAddingAddress(true)}
              >
                + Add Address
              </button>
            )}
          </label>

          {}
          {(isAddingAddress || editingAddress) && (
            <div
              style={{
                padding: '1.25rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '0.5rem',
                border: '1px solid var(--primary)',
                marginBottom: '1rem',
              }}
            >
              <form onSubmit={handleAddressSubmit} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    className="form-input"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    placeholder="Label (Home/Work)"
                    required
                    style={{ fontSize: '0.85rem' }}
                  />
                  <input
                    className="form-input"
                    value={addressForm.recipient_name}
                    onChange={(e) => setAddressForm({ ...addressForm, recipient_name: e.target.value })}
                    placeholder="Recipient Name"
                    required
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <input
                  className="form-input"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="Phone"
                  required
                  style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
                />
                <input
                  className="form-input"
                  value={addressForm.address_line1}
                  onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                  placeholder="AddressResponse Line 1"
                  required
                  style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
                />
                <input
                  className="form-input"
                  value={addressForm.address_line2 || ''}
                  onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                  placeholder="Address Line 2 (Optional)"
                  style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
                />
                <input
                  className="form-input"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  placeholder="City"
                  required
                  style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    className="form-input"
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    placeholder="Province"
                    required
                    style={{ fontSize: '0.85rem' }}
                  />
                  <input
                    className="form-input"
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                    placeholder="Postal Code"
                    required
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                  />
                  <label htmlFor="is_default" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Set as default address
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ flex: 1, padding: '0.35rem', fontSize: '0.8rem' }}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsAddingAddress(false);
                      setEditingAddress(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1, padding: '0.35rem', fontSize: '0.8rem' }}
                    onClick={(e) => handleAddressSubmit(e)}
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {addresses.length === 0 ? (
              <div className="form-input" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                No addresses saved.
              </div>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="form-input"
                  style={{
                    height: 'auto',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: addr.is_default ? '1px solid var(--primary)' : '1px solid var(--border)',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 600 }}>{addr.recipient_name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700 }}>[{addr.label}]</span>
                      {addr.isDefault() && <span style={{ fontSize: '0.65rem', border: '1px solid var(--primary)', borderRadius: '3px', padding: '0 2px', color: 'var(--primary)' }}>Default</span>}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {addr.oneLine()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    {!addr.isDefault() && (
                      <button
                        type="button"
                        className="nav-link"
                        style={{ padding: 0, fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--primary)' }}
                        onClick={() => handleSetDefault(addr.id)}
                      >
                        Set
                      </button>
                    )}
                    <button
                      type="button"
                      className="nav-link"
                      style={{ padding: 0, fontSize: '0.75rem', background: 'none', border: 'none' }}
                      onClick={() => {
                        setEditingAddress(addr)
                        setAddressForm({
                          label: addr.label ?? '',
                          recipient_name: addr.recipient_name,
                          phone: addr.phone,
                          address_line1: addr.address_line1,
                          address_line2: addr.address_line2 ?? '',
                          city: addr.city,
                          province: addr.province,
                          postal_code: addr.postal_code,
                          country: addr.country,
                          is_default: addr.is_default
                        })
                      }}
                    >
                      Edit
                    </button>
                    {!addr.isDefault() && (
                      <button
                        type="button"
                        className="nav-link"
                        style={{ padding: 0, fontSize: '0.75rem', background: 'none', border: 'none', color: '#f87171' }}
                        onClick={() => handleDeleteAddress(addr.id)}
                      >
                        Del
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2rem' }} disabled={loading}>
          {loading ? 'Saving Changes...' : 'Save Profile'}
        </button>
      </form>

      <div className="form-group" style={{ marginTop: '2.5rem' }}>
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
      </div>
    </div>
  )
}
