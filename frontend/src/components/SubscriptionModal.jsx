import { useState, useEffect } from 'react';

const CATEGORIES = ['Streaming','Music','Productivity','Creative','Gaming','Cloud','News','Other'];
const ICONS      = ['🎬','🎵','📊','🎨','🎮','☁️','📰','📦','📺','▶️','🖌️','💼'];

const EMPTY = { name:'', category:'Streaming', icon:'📦', price:'', billingCycleDays:30, expiryDate:'', autoRenew:true };

export default function SubscriptionModal({ subscription, onSave, onClose }) {
  const [form, setForm]       = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (subscription) setForm({
      name: subscription.name,
      category: subscription.category,
      icon: subscription.icon,
      price: subscription.price,
      billingCycleDays: subscription.billingCycleDays,
      expiryDate: subscription.expiryDate,
      autoRenew: subscription.autoRenew,
    });
  }, [subscription]);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.expiryDate) {
      alert('Name, price, and expiry date are required.'); return;
    }
    setLoading(true);
    await onSave({ ...form, price: Number(form.price) });
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width:420 }}>
        <div className="modal-title">{subscription ? 'Edit Subscription' : 'Add Subscription'}</div>

        {/* Icon picker */}
        <div className="form-group">
          <label className="form-label">Icon</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {ICONS.map((ic) => (
              <button key={ic} className="btn btn-sm"
                style={{ fontSize:18, padding:'4px 8px', ...(form.icon===ic ? { borderColor:'var(--accent)', background:'rgba(91,124,248,.15)' } : {}) }}
                onClick={() => setForm((f) => ({ ...f, icon:ic }))}>
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="form-group" style={{ gridColumn:'1/-1' }}>
            <label className="form-label">Service name</label>
            <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. Netflix" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Price (XOF)</label>
            <input className="form-input" type="number" value={form.price} onChange={set('price')} placeholder="7500" min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Billing cycle</label>
            <select className="form-input" value={form.billingCycleDays} onChange={set('billingCycleDays')}>
              <option value={7}>Weekly (7 days)</option>
              <option value={30}>Monthly (30 days)</option>
              <option value={365}>Yearly (365 days)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Expiry date</label>
            <input className="form-input" type="date" value={form.expiryDate} onChange={set('expiryDate')} />
          </div>
        </div>

        <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer', marginBottom:6 }}>
          <input type="checkbox" checked={form.autoRenew} onChange={set('autoRenew')} />
          Auto-renew (cron will process payment on expiry day)
        </label>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : subscription ? 'Save Changes' : 'Add Subscription'}
          </button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
