/* VendAI — API Client */
const API_BASE = '/api';

const API = {
  _token: null,
  _userId: null,

  init() {
    this._token = localStorage.getItem('vendai_token');
    this._userId = localStorage.getItem('vendai_user_id');
  },

  setAuth(token, userId) {
    this._token = token;
    this._userId = userId;
    localStorage.setItem('vendai_token', token);
    localStorage.setItem('vendai_user_id', userId);
  },

  clearAuth() {
    this._token = null;
    this._userId = null;
    localStorage.removeItem('vendai_token');
    localStorage.removeItem('vendai_user_id');
    localStorage.removeItem('vendai_user');
  },

  headers() {
    return {
      'Content-Type': 'application/json',
      'X-User-ID': this._userId || ''
    };
  },

  async request(method, path, body = null) {
    const opts = { method, headers: this.headers() };
    if (body) opts.body = JSON.stringify(body);
    let url = `${API_BASE}${path}`;
    if (method === 'GET') {
      url += (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
    }
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
    return data;
  },

  get: (path) => API.request('GET', path),
  post: (path, body) => API.request('POST', path, body),
  put: (path, body) => API.request('PUT', path, body),
  delete: (path) => API.request('DELETE', path),

  // Auth
  signup: (d) => API.post('/auth/signup', d),
  login: (d) => API.post('/auth/login', d),
  logout: () => API.post('/auth/logout'),
  forgotPassword: (email) => API.post('/auth/forgot-password', { email }),
  changeEmail: (email) => API.put('/auth/change-email', { email }),
  getProfile: () => API.get('/auth/profile'),
  updateProfile: (d) => API.put('/auth/profile', d),
  sendTestAlert: () => API.post('/auth/test-alert'),

  // Machines
  getMachines: () => API.get('/machines/'),
  addMachine: (d) => API.post('/machines/', d),
  getMachine: (id) => API.get(`/machines/${id}`),
  deleteMachine: (id) => API.delete(`/machines/${id}`),

  // Products
  getProducts: (machineId) => API.get(`/products/machine/${machineId}`),
  addProduct: (d) => API.post('/products/', d),
  deactivateProduct: (id) => API.post(`/products/${id}/deactivate`),
  restoreProduct: (id) => API.post(`/products/${id}/restore`),
  togglePriority: (id, val) => API.post(`/products/${id}/priority`, { is_priority: val }),
  restock: (d) => API.post('/products/restock', d),
  // Upload
  detectColumns: async (file, machineId) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('machine_id', machineId);
    const res = await fetch(`${API_BASE}/upload/detect-columns`, {
      method: 'POST',
      headers: { 'X-User-ID': API._userId },
      body: fd
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  processUpload: (d) => API.post('/upload/process', d),

  // Predictions
  getCalendar: (machineId, productName) =>
    API.get(`/predict/calendar?machine_id=${machineId}&product_name=${encodeURIComponent(productName)}`),
  retrain: (machineId) => API.post('/predict/retrain', { machine_id: machineId }),

  // Alerts
  getAlerts: () => API.get('/alerts/'),

  // Insights
  getInsights: (machineId) => API.get(`/insights/${machineId}`)
};

API.init();
