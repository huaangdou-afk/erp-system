import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.error || err.response?.data?.message || err.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export default api;

// ─── Type Definitions ───────────────────────────────────────

export interface Product {
  id: number;
  code: string;
  name: string;
  spec: string;
  unit: string;
  category: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  min_stock: number;
  created_at: string;
}

export interface CreateProduct {
  code: string;
  name: string;
  spec?: string;
  unit?: string;
  category?: string;
  purchase_price?: number;
  sale_price?: number;
  stock?: number;
  min_stock?: number;
}

export interface UpdateProduct {
  name?: string;
  spec?: string;
  unit?: string;
  category?: string;
  purchase_price?: number;
  sale_price?: number;
  stock?: number;
  min_stock?: number;
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface CreateSupplier {
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
}

export interface UpdateSupplier {
  name?: string;
  contact?: string;
  phone?: string;
  address?: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface CreateCustomer {
  code: string;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomer {
  name?: string;
  contact?: string;
  phone?: string;
  address?: string;
}

export interface OrderItem {
  id?: number;
  product_id: number;
  product_name?: string;
  product_code?: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  subtotal?: number;
}

export interface PurchaseOrder {
  id: number;
  order_no: string;
  supplier_id: number;
  supplier_name?: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  items: OrderItem[];
}

export interface SalesOrder {
  id: number;
  order_no: string;
  customer_id: number;
  customer_name?: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  items: OrderItem[];
}

export interface DashboardStats {
  total_products: number;
  total_suppliers: number;
  total_customers: number;
  total_sales_amount: number;
  total_purchases_amount: number;
  low_stock_count: number;
  recent_sales: Pick<SalesOrder, 'id' | 'order_no' | 'total_amount' | 'status' | 'created_at' | 'customer_name'>[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: { field: string; message: string }[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}

// ─── API Functions ───────────────────────────────────────────

export const productsApi = {
  list: (params?: { search?: string; category?: string }) =>
    api.get<ApiResponse<Product[]>>('/products', { params }),
  get: (id: number) => api.get<ApiResponse<Product>>(`/products/${id}`),
  create: (data: CreateProduct) => api.post<ApiResponse<Product>>('/products', data),
  update: (id: number, data: UpdateProduct) => api.put<ApiResponse<Product>>(`/products/${id}`, data),
  remove: (id: number) => api.delete<ApiResponse<null>>(`/products/${id}`),
};

export const suppliersApi = {
  list: (params?: { search?: string }) =>
    api.get<ApiResponse<Supplier[]>>('/suppliers', { params }),
  create: (data: CreateSupplier) => api.post<ApiResponse<Supplier>>('/suppliers', data),
  update: (id: number, data: UpdateSupplier) => api.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data),
  remove: (id: number) => api.delete<ApiResponse<null>>(`/suppliers/${id}`),
};

export const customersApi = {
  list: (params?: { search?: string }) =>
    api.get<ApiResponse<Customer[]>>('/customers', { params }),
  create: (data: CreateCustomer) => api.post<ApiResponse<Customer>>('/customers', data),
  update: (id: number, data: UpdateCustomer) => api.put<ApiResponse<Customer>>(`/customers/${id}`, data),
  remove: (id: number) => api.delete<ApiResponse<null>>(`/customers/${id}`),
};

export const purchasesApi = {
  list: (params?: { status?: string; start_date?: string; end_date?: string }) =>
    api.get<ApiResponse<PurchaseOrder[]>>('/purchases', { params }),
  create: (data: { supplier_id: number; items: Array<{ product_id: number; quantity: number; unit_price: number }> }) =>
    api.post<ApiResponse<PurchaseOrder>>('/purchases', data),
  updateStatus: (id: number, status: string) =>
    api.put<ApiResponse<PurchaseOrder>>(`/purchases/${id}`, { status }),
  remove: (id: number) => api.delete<ApiResponse<null>>(`/purchases/${id}`),
};

export const salesApi = {
  list: (params?: { status?: string; start_date?: string; end_date?: string }) =>
    api.get<ApiResponse<SalesOrder[]>>('/sales', { params }),
  create: (data: { customer_id: number; items: Array<{ product_id: number; quantity: number; unit_price: number }> }) =>
    api.post<ApiResponse<SalesOrder>>('/sales', data),
  updateStatus: (id: number, status: string) =>
    api.put<ApiResponse<SalesOrder>>(`/sales/${id}`, { status }),
  remove: (id: number) => api.delete<ApiResponse<null>>(`/sales/${id}`),
};

export const inventoryApi = {
  list: () => api.get<ApiResponse<Product[]>>('/inventory'),
  lowStock: () => api.get<ApiResponse<Product[]>>('/inventory/low-stock'),
};

export const statsApi = {
  get: () => api.get<ApiResponse<DashboardStats>>('/stats'),
};
