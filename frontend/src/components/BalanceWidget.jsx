import { useState } from 'react';
import { payment as paymentApi } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/dateHelpers';

const QUICK = [5000, 10000, 25000, 50000];

export default function BalanceWidget({ onTopupSuccess }) {
  const { user, updateBalance } = useAuth();
  const toast = useToast();
  const [show, setShow]       = useState(false);
  const [amount, setAmount]   = useState(10000);
  const [loading, setLoading] = useState(false);

  const balance = Number(user?.balance || 0);
  const balColor = balance < 5000 ? 'var(--red-soft)' : balance < 20000 ? 'var(--amber)' : 'var(--green)';

  const handleTopup = async () => {
    if (!amount || amount < 1000) { toast('Minimum top-up: 1,000 XOF', 'warn'); return; }
    setLoading(true);
    try {
      const { newBalance } = await paymentApi.topup(amount);
      updateBalance(newBalance);
      toast(`✓ Account topped up by ${formatCurrency(amount)}`, 'success');
      setShow(false);
      onTopupSuccess?.();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:10, letterSpacing:1.5, color:'var(--muted)', textTransform:'uppercase', marginBottom:4 }}>Account Balance</div>
          <div style={{ fontSize:28, fontWeight:700, letterSpacing:-1, color:balColor }}>{formatCurrency(balance)}</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{user?.name} · SubVault Wallet</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShow(true)}>+ Top Up Account</button>
      </div>

      {show && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShow(false)}>
          <div className="modal">
            <div className="modal-title">Top Up Account</div>

            <div className="form-group">
              <label className="form-label">Quick amounts</label>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {QUICK.map((a) => (
                  <button key={a} className="btn btn-sm"
                    style={amount === a ? { borderColor:'var(--accent)', color:'var(--accent)' } : {}}
                    onClick={() => setAmount(a)}>
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Custom amount (XOF)</label>
              <input type="number" className="form-input" value={amount}
                onChange={(e) => setAmount(Number(e.target.value))} min={1000} />
            </div>

            <div className="modal-actions">
              <button className="btn btn-success" onClick={handleTopup} disabled={loading}>
                {loading ? 'Processing...' : `Confirm ${formatCurrency(amount)}`}
              </button>
              <button className="btn" onClick={() => setShow(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
