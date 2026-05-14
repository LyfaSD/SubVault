import { useState, useEffect } from 'react';
import { admin as adminApi } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, daysRemaining } from '../utils/dateHelpers';

function StatCard({ label, value, color }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
      <div style={{ fontSize:10, letterSpacing:1.5, color:'var(--muted)', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700, color }}>{value}</div>
    </div>
  );
}

export default function Admin() {
  const toast = useToast();
  const [stats, setStats]   = useState(null);
  const [users, setUsers]   = useState([]);
  const [subs, setSubs]     = useState([]);
  const [txs, setTxs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('overview');
  const [editBal, setEditBal]   = useState(null);
  const [newBal, setNewBal]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [st, us, sb, tx] = await Promise.all([
        adminApi.getStats(), adminApi.getUsers(),
        adminApi.getSubscriptions(), adminApi.getTransactions(),
      ]);
      setStats(st); setUsers(us.users); setSubs(sb.subscriptions); setTxs(tx.transactions);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleResetSub = async (sub) => {
    try {
      await adminApi.resetSub(sub.id, 30);
      toast(`${sub.name} reset +30 days`, 'success');
      load();
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleUpdateBalance = async () => {
    if (!newBal || isNaN(newBal)) return;
    try {
      await adminApi.updateBalance(editBal.id, Number(newBal));
      toast(`Balance updated for ${editBal.name}`, 'success');
      setEditBal(null); load();
    } catch (err) { toast(err.message, 'error'); }
  };

  if (loading) return (
    <div style={{ padding:40, display:'flex', alignItems:'center', gap:12, color:'var(--muted)' }}>
      <div className="spinner" /> Loading admin data...
    </div>
  );

  const TABS = ['overview','users','subscriptions','transactions'];

  return (
    <div style={{ padding:'16px 20px', maxWidth:1200, margin:'0 auto' }}>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <span className="badge badge-blue">ADMIN PANEL</span>
        <span style={{ fontSize:12, color:'var(--muted)' }}>System overview — all users &amp; subscriptions</span>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'var(--surface)', borderRadius:10, padding:4, border:'1px solid var(--border)' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex:1, padding:7, border:'none', borderRadius:8, fontSize:11, fontWeight:600, letterSpacing:.5,
            background: tab===t ? 'var(--accent)' : 'transparent',
            color: tab===t ? '#fff' : 'var(--muted)',
            cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize', transition:'all .15s',
          }}>{t}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && stats && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
            <StatCard label="Total Users"        value={stats.totalUsers}    color="var(--accent)" />
            <StatCard label="Active Subs"         value={stats.totalSubs}     color="var(--green)" />
            <StatCard label="Expiring (7d)"       value={stats.expiringSoon}  color="var(--amber)" />
            <StatCard label="Successful Payments" value={stats.recentSuccess} color="var(--green)" />
            <StatCard label="Failed Payments"     value={stats.recentFailed}  color="var(--red-soft)" />
          </div>

          <div className="section-title">Users at a Glance</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
            {users.map((u) => {
              const bal = Number(u.balance);
              const bc  = bal < 5000 ? 'var(--red-soft)' : bal < 20000 ? 'var(--amber)' : 'var(--green)';
              return (
                <div key={u.id} className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700 }}>
                        {u.name} {u.isAdmin && <span className="badge badge-blue" style={{ fontSize:9 }}>ADMIN</span>}
                      </div>
                      <div style={{ fontSize:11, color:'var(--muted)' }}>{u.email}</div>
                    </div>
                    <button className="btn btn-sm" onClick={() => { setEditBal(u); setNewBal(String(u.balance)); }}>Edit</button>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <div>
                      <div style={{ fontSize:10, color:'var(--muted)', marginBottom:2 }}>Balance</div>
                      <div style={{ fontSize:18, fontWeight:700, color:bc }}>{formatCurrency(bal)}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:10, color:'var(--muted)', marginBottom:2 }}>Subscriptions</div>
                      <div style={{ fontSize:18, fontWeight:700, color:'var(--accent)' }}>{u.subCount}</div>
                    </div>
                  </div>
                  {u.failedPayments > 0 && (
                    <div style={{ marginTop:8, padding:'4px 8px', background:'rgba(240,69,69,.08)', borderRadius:6, fontSize:11, color:'var(--red-soft)' }}>
                      ⚠ {u.failedPayments} failed payment(s)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── USERS ── */}
      {tab === 'users' && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', padding:0 }}>
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Balance</th><th>Subs</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead>
            <tbody>
              {users.map((u) => {
                const bal = Number(u.balance);
                const bc  = bal < 5000 ? 'var(--red-soft)' : bal < 20000 ? 'var(--amber)' : 'var(--green)';
                return (
                  <tr key={u.id}>
                    <td style={{ fontWeight:600 }}>{u.name}</td>
                    <td style={{ color:'var(--muted)' }}>{u.email}</td>
                    <td style={{ color:bc, fontWeight:700 }}>{formatCurrency(bal)}</td>
                    <td>{u.subCount}</td>
                    <td><span className={`badge ${u.isAdmin ? 'badge-blue' : 'badge-gray'}`}>{u.isAdmin ? 'Admin' : 'User'}</span></td>
                    <td style={{ color:'var(--muted)', fontSize:11 }}>{formatDate(u.createdAt)}</td>
                    <td><button className="btn btn-sm" onClick={() => { setEditBal(u); setNewBal(String(u.balance)); }}>Edit Balance</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── SUBSCRIPTIONS ── */}
      {tab === 'subscriptions' && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', padding:0 }}>
          <table className="table">
            <thead><tr><th>User</th><th>Subscription</th><th>Price</th><th>Expiry</th><th>Days Left</th><th>Auto</th><th>Action</th></tr></thead>
            <tbody>
              {subs.map((sub) => {
                const d  = daysRemaining(sub.expiryDate);
                const dc = d < 0 ? 'var(--red-soft)' : d <= 2 ? 'var(--red-soft)' : d <= 7 ? 'var(--amber)' : 'var(--green)';
                return (
                  <tr key={sub.id}>
                    <td style={{ color:'var(--muted)', fontSize:11 }}>{sub.User?.name}</td>
                    <td>{sub.icon} {sub.name}</td>
                    <td>{formatCurrency(sub.price)}</td>
                    <td style={{ fontSize:11 }}>{formatDate(sub.expiryDate)}</td>
                    <td style={{ color:dc, fontWeight:700 }}>{d < 0 ? `${-d}d ago` : d===0 ? 'Today' : `${d}d`}</td>
                    <td><span className={`badge ${sub.autoRenew ? 'badge-green' : 'badge-gray'}`}>{sub.autoRenew ? 'Yes' : 'No'}</span></td>
                    <td><button className="btn btn-sm" onClick={() => handleResetSub(sub)}>Reset +30d</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      {tab === 'transactions' && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', padding:0 }}>
          <table className="table">
            <thead><tr><th>Status</th><th>User</th><th>Subscription</th><th>Amount</th><th>Trigger</th><th>Fail Reason</th><th>Date</th></tr></thead>
            <tbody>
              {txs.map((tx) => (
                <tr key={tx.id}>
                  <td><span className={`badge ${tx.status==='success' ? 'badge-green' : 'badge-red'}`}>{tx.status}</span></td>
                  <td style={{ fontSize:11, color:'var(--muted)' }}>{tx.User?.name}</td>
                  <td>{tx.Subscription?.icon} {tx.Subscription?.name}</td>
                  <td style={{ color: tx.status==='success' ? 'var(--green)' : 'var(--red-soft)', fontWeight:700 }}>{formatCurrency(tx.amount)}</td>
                  <td style={{ fontSize:11, color:'var(--muted)' }}>{tx.triggeredBy}</td>
                  <td style={{ fontSize:11, color:'var(--red-soft)' }}>{tx.failReason || '—'}</td>
                  <td style={{ fontSize:11, color:'var(--muted)' }}>{new Date(tx.createdAt).toLocaleDateString('en-US')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit balance modal */}
      {editBal && (
        <div className="modal-overlay" onClick={(e) => e.target===e.currentTarget && setEditBal(null)}>
          <div className="modal" style={{ width:320 }}>
            <div className="modal-title">Edit Balance — {editBal.name}</div>
            <div className="form-group">
              <label className="form-label">New balance (XOF)</label>
              <input className="form-input" type="number" value={newBal}
                onChange={(e) => setNewBal(e.target.value)} min="0" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={handleUpdateBalance}>Update</button>
              <button className="btn" onClick={() => setEditBal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
