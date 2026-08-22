import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://nolvi-backend-production.up.railway.app';
// Perfil asociado al número de WhatsApp que usa esta app.
// Pendiente: sustituirlo por autenticación de usuarios antes de abrir la app a más personas.
const NOLVI_USER_ID = '6a1aae67-2d8d-4602-9df3-ed4c205ab0a8';
const API_KEY = 'I_tNt7FJBlY-E_wyekT5D1CYc8sBxg_fF47i57OPMvY';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
};

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function authLogin(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Error al iniciar sesión');
  return data;
}

export async function authRegister(email, password) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Error al registrarse');
  return data;
}

async function _refreshTokens() {
  const refreshToken = await SecureStore.getItemAsync('refresh_token');
  if (!refreshToken) throw new Error('Sin refresh token');
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error('Sesión expirada');
  const data = await res.json();
  await SecureStore.setItemAsync('access_token',  data.access_token);
  await SecureStore.setItemAsync('refresh_token', data.refresh_token);
  return data.access_token;
}

// Fetch autenticado con Bearer JWT; renueva el token si recibe 401.
export async function authFetch(endpoint, options = {}) {
  let token = await SecureStore.getItemAsync('access_token');
  const makeRequest = (t) =>
    fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${t}`,
      },
    });

  let res = await makeRequest(token);
  if (res.status === 401) {
    token = await _refreshTokens();
    res = await makeRequest(token);
  }
  return res;
}

const api = {
  // ── Recordatorios ──
  async getReminders() {
    const res = await fetch(`${API_URL}/reminders/${NOLVI_USER_ID}`, { headers });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async createReminder(data) {
    const res = await fetch(`${API_URL}/reminders/${NOLVI_USER_ID}`, {
      method: 'POST', headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async deleteReminder(id) {
    const res = await fetch(`${API_URL}/reminders/${id}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },

  // ── Tareas ──
  async getTasks() {
    const res = await fetch(`${API_URL}/tasks/${NOLVI_USER_ID}`, { headers });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async createTask(data) {
    const res = await fetch(`${API_URL}/tasks/${NOLVI_USER_ID}`, {
      method: 'POST', headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async completeTask(id) {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ is_completed: true }),
    });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async deleteTask(id) {
    const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },

  // ── Gastos ──
  async getExpenses() {
    const res = await fetch(`${API_URL}/expenses/${NOLVI_USER_ID}`, { headers });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async createExpense(data) {
    const res = await fetch(`${API_URL}/expenses/${NOLVI_USER_ID}`, {
      method: 'POST', headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async deleteExpense(id) {
    const res = await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE', headers });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },

  // ── Cumpleaños ──
  async getBirthdays() {
    const res = await fetch(`${API_URL}/birthdays/${NOLVI_USER_ID}`, { headers });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async createBirthday(data) {
    const res = await fetch(`${API_URL}/birthdays/${NOLVI_USER_ID}`, {
      method: 'POST', headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
};

export default api;
