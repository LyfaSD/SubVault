import { daysRemaining, formatCurrency, countdownLabel } from '../utils/dateHelpers';

export default function AlertBanner({ subscriptions }) {
  const alerts = subscriptions.filter((s) => daysRemaining(s.expiryDate) <= 7);
  if (!alerts.length) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {alerts.map((sub) => {
        const days       = daysRemaining(sub.expiryDate);
        const isCritical = days <= 2;
        const color      = isCritical ? 'var(--red)' : 'var(--amber)';
        const bgColor    = isCritical ? 'rgba(240,69,69,.07)' : 'rgba(245,166,35,.07)';
        const badgeCls   = isCritical ? 'badge-red' : 'badge-amber';
        const label      = days < 0 ? 'EXPIRED' : isCritical ? 'URGENT' : 'REMINDER';

        return (
          <div key={sub.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:8, marginBottom:6, borderLeft:`3px solid ${color}`, background:bgColor }}>
            <span className={`badge ${badgeCls}`}>{label}</span>
            <span style={{ fontSize: 16 }}>{sub.icon}</span>
            <span style={{ fontSize: 13, flex: 1 }}>
              <strong>{sub.name}</strong> — <span style={{ color:'var(--muted)' }}>{countdownLabel(days)}</span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{formatCurrency(sub.price)}</span>
          </div>
        );
      })}
    </div>
  );
}
