import { daysRemaining, formatDate, formatCurrency, countdownLabel, STATUS_COLOR, STATUS_BADGE } from '../utils/dateHelpers';

function CountdownRing({ days }) {
  const pct   = Math.max(0, Math.min(1, days / 30));
  const r     = 28;
  const circ  = 2 * Math.PI * r;
  const fill  = circ * pct;
  const color = days < 0 ? 'var(--muted)' : days <= 2 ? 'var(--red)' : days <= 7 ? 'var(--amber)' : 'var(--green)';

  return (
    <div style={{ position:'relative', width:70, height:70 }}>
      <svg width="70" height="70" viewBox="0 0 70 70" style={{ transform:'rotate(-90deg)' }}>
        <circle cx="35" cy="35" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeLinecap="round" strokeDasharray={`${fill.toFixed(1)} ${circ}`} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:16, fontWeight:700, lineHeight:1, color }}>{Math.abs(days)}</span>
        <span style={{ fontSize:9, color:'var(--muted)', letterSpacing:.5 }}>{days < 0 ? 'AGO' : 'DAYS'}</span>
      </div>
    </div>
  );
}

export default function SubscriptionCard({ subscription, onRenew, onEdit, onDelete, userBalance }) {
  const days      = daysRemaining(subscription.expiryDate);
  const statusKey = days < 0 ? 'expired' : days <= 2 ? 'critical' : days <= 7 ? 'expiring' : 'active';
  const barColor  = STATUS_COLOR[statusKey];
  const badgeCls  = STATUS_BADGE[statusKey];
  const canRenew  = days <= 7 || days < 0;
  const hasBalance = userBalance >= subscription.price;

  const statusLabel = { active:'Active', expiring:'Expiring Soon', critical:'Critical', expired:'Expired' }[statusKey];

  return (
    <div style={{ background:'var(--surface)', border:`1px solid ${canRenew ? barColor : 'var(--border)'}`, borderRadius:12, padding:16, transition:'border-color .2s' }}>
      {/* Top bar */}
      <div style={{ height:3, background:barColor, margin:'-16px -16px 14px', borderRadius:'12px 12px 0 0' }} />

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:8, background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
            {subscription.icon}
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700 }}>{subscription.name}</div>
            <div style={{ fontSize:10, color:'var(--muted)', marginTop:1 }}>
              {subscription.category}{subscription.autoRenew ? ' · Auto-renew ✓' : ''}
            </div>
          </div>
        </div>
        <span className={`badge ${badgeCls}`}>{statusLabel}</span>
      </div>

      {/* Ring */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', margin:'10px 0 14px' }}>
        <CountdownRing days={days} />
        <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>{countdownLabel(days)}</div>
      </div>

      {/* Progress bar */}
      <div style={{ height:4, background:'var(--border)', borderRadius:2, marginBottom:14, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${Math.max(0,Math.min(100,(days/30)*100)).toFixed(0)}%`, background:barColor, borderRadius:2, transition:'width .5s' }} />
      </div>

      {/* Details */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:11, color:'var(--muted)' }}>Price</span>
        <span style={{ fontSize:12, fontWeight:600 }}>{formatCurrency(subscription.price)}</span>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontSize:11, color:'var(--muted)' }}>Expires</span>
        <span style={{ fontSize:12, fontWeight:600 }}>{formatDate(subscription.expiryDate)}</span>
      </div>

      {/* Buttons */}
      <div style={{ display:'flex', gap:6 }}>
        {canRenew ? (
          <button
            onClick={() => {
              onRenew(subscription);
              if (subscription.url) {
              window.open(subscription.url, '_blank', 'noopener,noreferrer');
              }
            }}
            className={`btn ${!hasBalance ? 'btn-danger' : statusKey === 'critical' || statusKey === 'expired' ? 'btn-danger' : ''}`}
            style={{
              flex:1, padding:'8px', fontSize:12,
              ...(hasBalance && statusKey === 'expiring' ? { background:'var(--amber)', border:'none', color:'#000' } : {}),
              ...(hasBalance && statusKey === 'active'   ? { background:'var(--accent)', border:'none', color:'#fff' } : {}),
            }}
          >
            {!hasBalance ? '⚠ Insufficient Funds' : days < 0 ? 'Renew Now' : 'Renew Early'}
          </button>
        ) : (
          <button className="btn" style={{ flex:1, padding:'8px', fontSize:12 }} disabled>Active</button>
        )}
        <button className="btn btn-sm" onClick={() => onEdit(subscription)} title="Edit">✎</button>
        <button className="btn btn-sm" onClick={() => onDelete(subscription)} title="Delete"
          style={{ color:'var(--red-soft)', borderColor:'var(--red)' }}>✕</button>
      </div>
    </div>
  );
}
