const BASE = import.meta.env.VITE_API_URL;

function getHeaders(withAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const user = JSON.parse(localStorage.getItem('elegance_user') || 'null');
    if (user?.id) headers['X-User-Id'] = user.id;
  }
  return headers;
}

async function request(path, options = {}, auth = false) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(auth), ...(options.headers || {}) }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export const api = {
  
  getTables: (params) => request('/api/tables' + (params ? '?' + new URLSearchParams(params) : '')),
  updateTable: (id, data) => request(`/api/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) }, true),
  createTable: (data) => request('/api/admin/tables', { method: 'POST', body: JSON.stringify(data) }, true),
  deleteTable: (id) => request(`/api/admin/tables/${id}`, { method: 'DELETE' }, true),

  getMenu: () => request('/api/menu'),
  createMenuItem: (data) => request('/api/admin/menu', { method: 'POST', body: JSON.stringify(data) }, true),
  deleteMenuItem: (id) => request(`/api/admin/menu/${id}`, { method: 'DELETE' }, true),

  reserve: (data) => request('/api/reserve', { method: 'POST', body: JSON.stringify(data) }, true),
  getMyReservations: () => request('/api/my-reservations', {}, true),
  cancelReservation: (id) => request(`/api/reservations/${id}/cancel`, { method: 'PATCH' }, true),
  deleteReservation: (id) => request(`/api/admin/reservations/${id}`, { method: 'DELETE' }, true),

  getAdminReservations: (params) => request('/api/admin/reservations' + (params ? '?' + new URLSearchParams(params) : ''), {}, true),
  updateReservationStatus: (id, status) => request(`/api/admin/reservations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, true),
  getStats: () => request('/api/admin/stats', {}, true),

  registerPassword: (data) => request('/api/auth/register-password', { method: 'POST', body: JSON.stringify(data) }),
  loginPassword: (data) => request('/api/auth/login-password', { method: 'POST', body: JSON.stringify(data) }),

  registerOptions: (data) => request('/api/auth/register-options', { method: 'POST', body: JSON.stringify(data) }),
  registerVerify: (data) => request('/api/auth/register-verify', { method: 'POST', body: JSON.stringify(data) }),
  loginOptions: (data) => request('/api/auth/login-options', { method: 'POST', body: JSON.stringify(data) }),
  loginVerify: (data) => request('/api/auth/login-verify', { method: 'POST', body: JSON.stringify(data) }),
};
