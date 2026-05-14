const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const auth = {
  login:    (email, password)        => request('/auth/login',    { method: 'POST', body: { email, password } }),
  register: (name, email, password)  => request('/auth/register', { method: 'POST', body: { name, email, password } }),
  me:       ()                       => request('/auth/me'),
};

export const subscriptions = {
  getAll:    ()           => request('/subscriptions'),
  getExpiring: (days = 7) => request(`/subscriptions/expiring?days=${days}`),
  create:    (data)       => request('/subscriptions',      { method: 'POST',   body: data }),
  update:    (id, data)   => request(`/subscriptions/${id}`,{ method: 'PUT',    body: data }),
  delete:    (id)         => request(`/subscriptions/${id}`,{ method: 'DELETE' }),
};

export const payment = {
  process:        (subscriptionId) => request('/payment/process', { method: 'POST', body: { subscriptionId } }),
  topup:          (amount)         => request('/payment/topup',   { method: 'POST', body: { amount } }),
  getTransactions: ()              => request('/payment/transactions'),
};

export const admin = {
  getStats:         ()              => request('/admin/stats'),
  getUsers:         ()              => request('/admin/users'),
  getSubscriptions: ()              => request('/admin/subscriptions'),
  getTransactions:  (filters = {})  => request(`/admin/transactions?${new URLSearchParams(filters)}`),
  resetSub:         (id, days = 30) => request(`/admin/subscriptions/${id}/reset`, { method: 'PATCH', body: { days } }),
  updateBalance:    (id, balance)   => request(`/admin/users/${id}/balance`,        { method: 'PATCH', body: { balance } }),
};
