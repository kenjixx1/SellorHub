import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { cartService } from '../lib/services/cartService'
import { addressService } from '../lib/services/addressService'
import { orderService } from '../lib/services/orderService'
import { storeService } from '../lib/services/storeService'
import { API_BASE_URL } from '../lib/api'
import { Address } from '../lib/models'
import { Store } from '../lib/models/Store'

export default function CheckoutPage() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [isChangingAddress, setIsChangingAddress] = useState(false)
  
  const [items, setItems] = useState<any[]>([]) // CartItem[] or DirectCheckoutItem[]
  const [stores, setStores] = useState<Record<number, Store>>({})
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'card'>('qr')

  const SHIPPING_FEE_PER_STORE = 40

  useEffect(() => {
    if (!token) return
    loadData()
  }, [token])

  const loadData = async () => {
    setLoading(true)
    try {
      // 1. Load AddressResponsees
      const addrList = await addressService.getAll(token!)
      const addrModels = addrList.map(Address.fromDto)
      setAddresses(addrModels)
      setSelectedAddress(addrModels.find(a => a.isDefault()) || addrModels[0] || null)

      // 2. Load Checkout Items
      const buyNowStr = sessionStorage.getItem('buy_now_item')
      const cartIdsStr = sessionStorage.getItem('checkout_item_ids')

      let checkoutItems: any[] = []
      if (buyNowStr) {
        checkoutItems = [JSON.parse(buyNowStr)]
      } else if (cartIdsStr) {
        const cartIds = JSON.parse(cartIdsStr) as number[]
        const cartData = await cartService.getCart(token!)
        checkoutItems = cartData.items.filter(i => cartIds.includes(i.id))
      } else {
        // No items to checkout, go back to cart
        navigate('/cart')
        return
      }
      setItems(checkoutItems)

      // 3. Resolve Store Metadata
      const storeIds = Array.from(new Set(checkoutItems.map(i => i.product.store_id)))
      const storeList = await storeService.listStores({ limit: 100 })
      const storeMap: Record<number, Store> = {}
      storeList.items.forEach(s => {
        if (storeIds.includes(s.id)) storeMap[s.id] = Store.fromDto(s)
      })
      setStores(storeMap)

    } catch (err) {
      console.error('Checkout load failed', err)
    } finally {
      setLoading(false)
    }
  }

  const groupedItems = useMemo(() => {
    const map: Record<number, any[]> = {}
    items.forEach(item => {
      const sid = item.product.store_id
      if (!map[sid]) map[sid] = []
      map[sid].push(item)
    })
    return Object.entries(map).map(([sid, items]) => ({
      storeId: Number(sid),
      store: stores[Number(sid)],
      items
    }))
  }, [items, stores])

  const subtotal = items.reduce((sum, i) => sum + (Number(i.product.price) * i.quantity), 0)
  const totalShipping = groupedItems.length * SHIPPING_FEE_PER_STORE
  const totalAmount = subtotal + totalShipping

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a shipping address.')
      return
    }
    
    setPlacingOrder(true)
    try {
      // Multiple stores = Multiple orders
      const orderPromises = groupedItems.map(group => {
        const isDirect = sessionStorage.getItem('buy_now_item') !== null
        if (isDirect) {
          return orderService.createDirect(
            token!, 
            group.storeId, 
            group.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
            selectedAddress.id
          )
        } else {
          // Note: Backend might not support partial cart checkout per store easily if items are not exactly the same.
          // However, the common pattern is order-per-store.
          return orderService.createFromCart(token!, group.storeId, selectedAddress.id)
        }
      })

      const results = await Promise.all(orderPromises)
      
      // Clear session
      sessionStorage.removeItem('buy_now_item')
      sessionStorage.removeItem('checkout_item_ids')
      
      navigate('/checkout/success', { state: { orders: results } })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Order failed')
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) return <div className="page-container"><p>Confirming your details...</p></div>

  return (
    <div className="page-container" style={{ maxWidth: '1000px', paddingBottom: '3rem' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ 
          background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem',
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

      <h1 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
         <svg style={{ width: '2rem', color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
         </svg>
         Checkout
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '2rem', alignItems: 'start' }}>
        
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* AddressResponse Section */}
          <section style={{ background: 'var(--glass)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg style={{ width: '1.2rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Delivery Address
               </h3>
               <button onClick={() => setIsChangingAddress(!isChangingAddress)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
                  {isChangingAddress ? 'Cancel' : 'Change'}
               </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {isChangingAddress ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {addresses.length === 0 ? (
                    <p>No addresses found. <Link to="/profile" style={{ color: 'var(--primary)' }}>Add one in your profile.</Link></p>
                  ) : (
                    addresses.map(addr => (
                      <button 
                        key={addr.id}
                        onClick={() => { setSelectedAddress(addr); setIsChangingAddress(false); }}
                        style={{ 
                          textAlign: 'left', 
                          padding: '1rem', 
                          borderRadius: '8px', 
                          border: selectedAddress?.id === addr.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: 'rgba(0,0,0,0.2)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{addr.recipient_name} ({addr.label})</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{addr.phone}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{addr.address_line1}, {addr.city}</div>
                      </button>
                    ))
                  )}
                </div>
              ) : selectedAddress ? (
                <div>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedAddress.recipient_name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{selectedAddress.phone}</span>
                    {selectedAddress.isDefault() && <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Default</span>}
                  </div>
                  <div style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {selectedAddress.oneLine()}
                  </div>
                </div>
              ) : (
                <p>Please <Link to="/profile" style={{ color: 'var(--primary)' }}>add an address</Link> to proceed.</p>
              )}
            </div>
          </section>

          {/* Product Items Grouped by Store */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {groupedItems.map(group => (
              <section key={group.storeId} style={{ background: 'var(--glass)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)', fontWeight: 700 }}>
                  {group.store?.name || `Store #${group.storeId}`}
                </div>
                {group.items.map((item, idx) => (
                  <div key={idx} style={{ 
                    padding: '1.25rem', 
                    display: 'grid', 
                    gridTemplateColumns: '80px 1fr 100px 100px', 
                    alignItems: 'center',
                    gap: '1.5rem',
                    borderBottom: idx < group.items.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <img src={item.product.image_url?.startsWith('http') ? item.product.image_url : `${API_BASE_URL}${item.product.image_url}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>{item.product.title}</h4>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Qty: {item.quantity}</p>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 600 }}>฿{Number(item.product.price).toLocaleString()}</div>
                    <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>฿{(Number(item.product.price) * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
                <div style={{ padding: '1rem 1.25rem', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span>Shipping Fee</span>
                  <span>฿{SHIPPING_FEE_PER_STORE.toLocaleString()}</span>
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Sidebar Summary */}
        <aside style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Payment Method */}
          <section style={{ background: 'var(--glass)', borderRadius: '1rem', border: '1px solid var(--border)', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1rem' }}>Payment Method</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                onClick={() => setPaymentMethod('qr')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer',
                  border: paymentMethod === 'qr' ? '2px solid var(--primary)' : '1px solid var(--border)', 
                  background: paymentMethod === 'qr' ? 'rgba(129, 140, 248, 0.1)' : 'transparent',
                  color: '#fff'
                }}
              >
                <div style={{ fontSize: '1.25rem' }}>📱</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>QR PromptPay</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Free processing</div>
                </div>
              </button>
              <button 
                onClick={() => setPaymentMethod('card')}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer',
                  border: paymentMethod === 'card' ? '2px solid var(--primary)' : '1px solid var(--border)', 
                  background: paymentMethod === 'card' ? 'rgba(129, 140, 248, 0.1)' : 'transparent',
                  color: '#fff'
                }}
              >
                <div style={{ fontSize: '1.25rem' }}>💳</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Credit / Debit Card</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Visa, Mastercard, JCB</div>
                </div>
              </button>
            </div>
          </section>

          {/* Final Summary */}
          <section style={{ background: 'var(--glass)', borderRadius: '1rem', border: '1px solid var(--primary)', padding: '1.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
             <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.1rem' }}>Order Summary</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Merchandise Subtotal</span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Shipping Total</span>
                  <span>฿{totalShipping.toLocaleString()}</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border)', margin: '0.25rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.25rem' }}>
                  <span>Total Payment</span>
                  <span style={{ color: 'var(--primary)' }}>฿{totalAmount.toLocaleString()}</span>
                </div>
             </div>
             
             <button 
               className="btn-primary" 
               style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: '8px' }}
               onClick={handlePlaceOrder}
               disabled={placingOrder || !selectedAddress}
             >
               {placingOrder ? 'Processing...' : 'Place Order'}
             </button>
             
             <p style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
               By clicking Place Order, you agree to SellorHub's Terms of Service.
             </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
