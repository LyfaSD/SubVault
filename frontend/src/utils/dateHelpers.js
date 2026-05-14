export function daysRemaining(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((new Date(dateStr) - today) / 86400000);
}

export function statusFromDays(d) {
  if (d < 0)  return 'expired';
  if (d <= 2) return 'critical';
  if (d <= 7) return 'expiring';
  return 'active';
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatCurrency(amount, currency = 'XOF') {
  return `${Number(amount).toLocaleString('en-US')} ${currency}`;
}

export function countdownLabel(days) {
  if (days < 0)   return `Expired ${-days} day(s) ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `${days} days remaining`;
}

export const STATUS_COLOR = {
  active:   'var(--green)',
  expiring: 'var(--amber)',
  critical: 'var(--red)',
  expired:  'var(--muted)',
};

export const STATUS_BADGE = {
  active:   'badge-green',
  expiring: 'badge-amber',
  critical: 'badge-red',
  expired:  'badge-gray',
};
