import { useLocation, Link, Navigate } from 'react-router-dom'

export default function OrderSuccessPage() {
  const location = useLocation()
  const orders = location.state?.orders

  if (!orders || orders.length === 0) {
    return <Navigate to="/explore" replace />
  }

  const totalPaid = orders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0)

  return (
    <div className="page-container" style={{ maxWidth: '600px', textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ background: 'var(--glass)', borderRadius: '2rem', border: '1px solid var(--border)', padding: '4rem 2rem', boxShadow: '0 20px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
           <div style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#10b981', width: '120px', height: '120px', borderRadius: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '4rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
           </div>
        </div>

        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Order Success!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
          Thank you for your purchase via SellorHub. Your payment has been received and the sellers have been notified.
        </p>

        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '2.5rem', textAlign: 'left' }}>
           <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
             Order Numbers ({orders.length})
           </div>
           {orders.map((o: any) => (
             <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontWeight: 600 }}>
               <span>{o.order_number}</span>
               <span style={{ color: 'var(--primary)' }}>฿{Number(o.total_amount).toLocaleString()}</span>
             </div>
           ))}
           <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
              <span>Total Paid</span>
              <span>฿{totalPaid.toLocaleString()}</span>
           </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link to="/orders" className="btn-primary" style={{ padding: '1rem', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 700 }}>
            View My Orders
          </Link>
          <Link to="/explore" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
