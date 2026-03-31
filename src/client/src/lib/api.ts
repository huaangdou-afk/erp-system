import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ─── Products ───────────────────────────────────────────────
export const productsApi = {
  list: (params?: { search?: string; category?: string }) =>
    api.get('/products', { params }),
  get: (id: number) => api.get(`/products/${id}`),
  create: (data: Record<string, unknown>) => api.post('/products', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/products/${id}`, data),
  remove: (id: number) => api.delete(`/products/${id}`),
};

// ─── Suppliers ───────────────────────────────────────────────
export const suppliersApi = {
  list: (params?: { search?: string }) =>
    api.get('/suppliers', { params }),
  create: (data: Record<string, unknown>) => api.post('/suppliers', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/suppliers/${id}`, data),
  remove: (id: number) => api.delete(`/suppliers/${id}`),
};

// ─── Customers ──────────────────────────────────────────────
export const customersApi = {
  list: (params?: { search?: string }) =>
    api.get('/customers', { params }),
  create: (data: Record<string, unknown>) => api.post('/customers', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/customers/${id}`, data),
  remove: (id: number) => api.delete(`/customers/${id}`),
};

// ─── Purchases ──────────────────────────────────────────────
export const purchasesApi = {
  list: (params?: { status?: string }) =>
    api.get('/purchases', { params }),
  create: (data: { supplier_id: number; items: Array<{ product_id: number; quantity: number; unit_price: number }> }) =>
    api.post('/purchases', data),
  updateStatus: (id: number, status: string) =>
    api.put(`/purchases/${id}`, { status }),
  remove: (id: number) => api.delete(`/purchases/${id}`),
};

// ─── Sales ──────────────────────────────────────────────────
export const salesApi = {
  list: (params?: { status?: string }) =>
    api.get('/sales', { params }),
  create: (data: { customer_id: number; items: Array<{ product_id: number; quantity: number; unit_price: number }> }) =>
    api.post('/sales', data),
  updateStatus: (id: number, status: string) =>
    api.put(`/sales/${id}`, { status }),
  remove: (id: number) => api.delete(`/sales/${id}`),
};

// ─── Inventory ──────────────────────────────────────────────
export const inventoryApi = {
  list: () => api.get('/inventory'),
  lowStock: () => api.get('/inventory/low-stock'),
};
