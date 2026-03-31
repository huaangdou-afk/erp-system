import { create } from 'zustand';
import { salesApi } from '../lib/api';

export interface SalesItem {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  unit: string;
}

export interface SalesOrder {
  id: number;
  order_no: string;
  customer_id: number;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  items: SalesItem[];
}

interface SalesStore {
  orders: SalesOrder[];
  loading: boolean;
  error: string | null;
  fetch: (status?: string) => Promise<void>;
  create: (data: { customer_id: number; items: Array<{ product_id: number; quantity: number; unit_price: number }> }) => Promise<void>;
  updateStatus: (id: number, status: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useSalesStore = create<SalesStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetch: async (status?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await salesApi.list({ status });
      set({ orders: res.data.data, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  create: async (data) => {
    await salesApi.create(data);
    await get().fetch();
  },

  updateStatus: async (id, status) => {
    await salesApi.updateStatus(id, status);
    await get().fetch();
  },

  remove: async (id) => {
    await salesApi.remove(id);
    await get().fetch();
  },
}));
