import { useState, useEffect, useCallback } from 'react';
import { subscriptions as subsApi, payment as paymentApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, daysRemaining } from '../utils/dateHelpers';
import BalanceWidget      from '../components/BalanceWidget';
import AlertBanner        from '../components/AlertBanner';
import SubscriptionCard   from '../components/SubscriptionCard';
import SubscriptionModal  from '../components/SubscriptionModal';
import { useBreakpoint } from '../utils/useBreakpoint';

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
      <div style={{ fontSize:10, letterSpacing:1.5, color:'var(--muted)', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, letterSpacing:-1, color }}>{value}</div>
      <div style={{ fontSize:10, color:'var(--muted)', marginTop:3 }}>{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user, updateBalance } = useAuth();
  const { isMobile, isTablet } = useBreakpoint();
  const toast = useToast();

  const [subs, setSubs]           = useState([]);
  const [txs, setTxs]             = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);   // null | 'add' | subscription obj
  const [delConfirm, setDelConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([subsApi.getAll(), paymentApi.getTransactions()]);
      setSubs(s.subscriptions);
      setTxs(t.transactions);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Stats
  const activeSubs   = subs.filter((s) => daysRemaining(s.expiryDate) >= 0);
  const expiringSubs = subs.filter((s) => { const d = daysRemaining(s.expiryDate); return d >= 0 && d <= 7; });
  const monthlyTotal = activeSubs.reduce((sum, s) => sum + Number(s.price), 0);
  const paidMonth    = txs
    .filter((t) => t.status === 'success' && new Date(t.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Payment
  const handleRenew = async (sub) => {
    try {
      const result = await paymentApi.process(sub.id);
      updateBalance(result.newBalance);
      toast(`✓ ${sub.name} renewed — ${formatCurrency(result.amountCharged)} charged`, 'success');
      load();
    } catch (err) {
      toast(err.status === 402 ? `Insufficient funds — top up to renew ${sub.name}` : err.message, 'error');
    }
  };

  // CRUD
  const handleSave = async (formData) => {
    try {
      modal?.id ? await subsApi.update(modal.id, formData) : await subsApi.create(formData);
      toast(modal?.id ? 'Subscription updated' : 'Subscription added', 'success');
      setModal(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleDelete = async (sub) => {
    try {
      await subsApi.delete(sub.id);
      toast(`${sub.name} deleted`, 'info');
      setDelConfirm(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading) return (
    <div style={{ padding:40, display:'flex', alignItems:'center', gap:12, color:'var(--muted)' }}>
      <div className="spinner" /> Loading...
    </div>
  );

  return (
    <div style={{ padding:'16px 20px', maxWidth:1200, margin:'0 auto' }}>

      <BalanceWidget onTopupSuccess={load} />
      <AlertBanner subscriptions={subs} />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 8 : 12, marginBottom: 20 }}>
        <StatCard label="Active"        value={activeSubs.length}          color="var(--green)"  sub="subscriptions" />
        <StatCard label="Expiring Soon" value={expiringSubs.length}        color="var(--amber)"  sub="within 7 days" />
        <StatCard label="Monthly Cost"  value={formatCurrency(monthlyTotal)} color="var(--accent)" sub="total recurring" />
        <StatCard label="Paid This Month" value={formatCurrency(paidMonth)} color="var(--green)"  sub="processed" />
      </div>

      {/* Subscriptions header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div className="section-title" style={{ margin:0, flex:1 }}>Subscriptions</div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal('add')} style={{ marginLeft:16 }}>
          + Add
        </button>
      </div>

      {subs.length === 0 ? (
        <div style={{ padding:40, textAlign:'center', color:'var(--muted)', background:'var(--surface)', borderRadius:12 }}>
          No subscriptions yet. Click <strong style={{ color:'var(--accent)' }}>+ Add</strong> to get started.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(auto-fill, minmax(270px,1fr))', gap: isMobile ? 10 : 14, marginBottom: 24 }}>
          {subs.map((sub) => (
            <SubscriptionCard
              key={sub.id}
              subscription={sub}
              userBalance={Number(user?.balance || 0)}
              onRenew={handleRenew}
              onEdit={(s) => setModal(s)}
              onDelete={(s) => setDelConfirm(s)}
            />
          ))}
        </div>
      )}

      {/* Transactions */}
      {txs.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop:8 }}>Recent Transactions</div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', padding:0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr><th>Status</th><th>Subscription</th><th>Amount</th><th>Type</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {txs.slice(0, 10).map((tx) => (
                    <tr key={tx.id}>
                      <td><span className={`badge ${tx.status === 'success' ? 'badge-green' : 'badge-red'}`}>{tx.status}</span></td>
                      <td>{tx.Subscription?.icon} {tx.Subscription?.name}</td>
                      <td style={{ color: tx.status==='success' ? 'var(--green)' : 'var(--red-soft)', fontWeight:700 }}>
                        {tx.status==='success' ? '-' : ''}{formatCurrency(tx.amount)}
                      </td>
                      <td style={{ color:'var(--muted)', fontSize:11 }}>{tx.triggeredBy}</td>
                      <td style={{ color:'var(--muted)', fontSize:11 }}>{new Date(tx.createdAt).toLocaleDateString('en-US')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit modal */}
      {modal && (
        <SubscriptionModal
          subscription={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target===e.currentTarget && setDelConfirm(null)}>
          <div className="modal" style={{ width:340 }}>
            <div className="modal-title">Delete Subscription</div>
            <p style={{ fontSize:13, color:'var(--muted)', marginBottom:8 }}>
              Are you sure you want to delete <strong style={{ color:'var(--text)' }}>{delConfirm.name}</strong>? This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={() => handleDelete(delConfirm)}>Delete</button>
              <button className="btn" onClick={() => setDelConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
