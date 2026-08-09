const API_URL = 'https://nolvi-backend-production.up.railway.app';
const TEST_USER_ID = '895f5e7a-1c17-4bb9-bea2-c8325694cd19';

const api = {
  // ── Recordatorios ──
  async getReminders() {
    const res = await fetch(`${API_URL}/reminders/${TEST_USER_ID}`);
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async createReminder(data) {
    const res = await fetch(`${API_URL}/reminders/${TEST_USER_ID}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async deleteReminder(id) {
    const res = await fetch(`${API_URL}/reminders/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },

  // ── Tareas ──
  async getTasks() {
    const res = await fetch(`${API_URL}/tasks/${TEST_USER_ID}`);
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async createTask(data) {
    const res = await fetch(`${API_URL}/tasks/${TEST_USER_ID}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async completeTask(id) {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: true }),
    });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async deleteTask(id) {
    const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },

  // ── Gastos ──
  async getExpenses() {
    const res = await fetch(`${API_URL}/expenses/${TEST_USER_ID}`);
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async createExpense(data) {
    const res = await fetch(`${API_URL}/expenses/${TEST_USER_ID}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async deleteExpense(id) {
    const res = await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },

  // ── Cumpleaños ──
  async getBirthdays() {
    const res = await fetch(`${API_URL}/birthdays/${TEST_USER_ID}`);
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
  async createBirthday(data) {
    const res = await fetch(`${API_URL}/birthdays/${TEST_USER_ID}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error');
    return res.json();
  },
};

export default api;
