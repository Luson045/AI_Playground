// base URL for all backend requests. The variable may be set to the
// **root** of the backend (e.g. https://ai-playground-mmsp.onrender.com) or
// to a path including `/api`.  We normalise it so that callers always have
// the `/api` prefix – during development `'/api'` is used and proxied by
// Vite.
let API = import.meta.env.VITE_API_URL || '';
if (API) {
  // strip trailing slash first
  API = API.replace(/\/+$/, '');
  if (!API.endsWith('/api')) API = API + '/api';
} else {
  API = '/api';
}

export const FRIENDLY_ERROR = "Can't reach the server right now. Please try again in a moment.";

function getToken() {
  return localStorage.getItem('token');
}

function headers(includeAuth = true) {
  const h = { 'Content-Type': 'application/json' };
  if (includeAuth && getToken()) h['Authorization'] = `Bearer ${getToken()}`;
  return h;
}

function friendlyError(err, fallback = FRIENDLY_ERROR) {
  if (err instanceof TypeError && err.message === 'Failed to fetch') return fallback;
  if (err.message && typeof err.message === 'string' && err.message.length < 120) return err.message;
  return fallback;
}

export async function authRegister(email, password, name = '', location = '') {
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: headers(false),
      body: JSON.stringify({ email, password, name, location }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  } catch (err) {
    throw new Error(friendlyError(err, 'Registration failed. Please try again.'));
  }
}

export async function authLogin(email, password) {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: headers(false),
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  } catch (err) {
    throw new Error(friendlyError(err, 'Login failed. Please try again.'));
  }
}

export async function authMe() {
  try {
    const res = await fetch(`${API}/auth/me`, { headers: headers() });
    if (res.status === 401) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Auth check failed');
    return data.user;
  } catch (err) {
    throw new Error(friendlyError(err, 'Auth check failed. Please try again.'));
  }
}

export async function productsList(params = {}) {
  const sp = new URLSearchParams();
  if (params.category) sp.set('category', params.category);
  if (params.q) sp.set('q', params.q);
  if (params.seller) sp.set('seller', params.seller);
  const url = `${API}/products` + (sp.toString() ? `?${sp}` : '');
  const res = await fetch(url, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  return Array.isArray(data) ? data : [];
}

export async function productsMy() {
  try {
    const res = await fetch(`${API}/products/my`, { headers: headers() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || FRIENDLY_ERROR);
    return data;
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function productCreate(body) {
  try {
    const res = await fetch(`${API}/products`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || FRIENDLY_ERROR);
    return data;
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function productDelete(id) {
  try {
    const res = await fetch(`${API}/products/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || FRIENDLY_ERROR);
    return data;
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function productClick(id) {
  const res = await fetch(`${API}/products/${id}/click`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({}),
  });
  if (!res.ok) return;
  return res.json();
}

export async function chatSend(message, history = [], sessionId = null) {
  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ message, history, sessionId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || FRIENDLY_ERROR);
    return data;
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function chatClick(productId, sessionId = null) {
  const res = await fetch(`${API}/chat/click`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ productId, sessionId }),
  });
  if (!res.ok) return;
  return res.json();
}

export async function ratingCreate({ star, comment = '', source = 'popup', sessionId = null }) {
  const res = await fetch(`${API}/ratings`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ star, comment, source, sessionId }),
  });
  if (!res.ok) return { ok: false };
  return res.json();
}

export async function analyticsGet() {
  try {
    const res = await fetch(`${API}/analytics`, { headers: headers() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || FRIENDLY_ERROR);
    return data;
  } catch (err) {
    throw new Error(friendlyError(err));
  }
}

export async function usersList() {
  const res = await fetch(`${API}/users`, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  return Array.isArray(data) ? data : [];
}

export async function userProfile(id) {
  const res = await fetch(`${API}/users/${id}`, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || 'User not found');
  return data;
}

export async function userFollow(id) {
  const res = await fetch(`${API}/users/${id}/follow`, {
    method: 'POST',
    headers: headers(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || FRIENDLY_ERROR);
  return data;
}

export async function userUnfollow(id) {
  const res = await fetch(`${API}/users/${id}/follow`, {
    method: 'DELETE',
    headers: headers(),
  });
  const data = await res.json().catch(() => ({}));
  return data;
}

export async function messagesGet() {
  try {
    const res = await fetch(`${API}/messages`, { headers: headers() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { inbox: [], sent: [] };
    return { inbox: data.inbox || [], sent: data.sent || [] };
  } catch (err) {
    return { inbox: [], sent: [] };
  }
}

export async function messageSend(to, body, subject = '') {
  const res = await fetch(`${API}/messages`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ to, body, subject }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to send message');
  return data;
}

export async function messageMarkRead(id) {
  await fetch(`${API}/messages/${id}/read`, {
    method: 'PATCH',
    headers: headers(),
  });
}
