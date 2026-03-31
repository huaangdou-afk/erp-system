import { create } from 'zustand';
import { purchasesApi } from '../lib/api';

export interface PurchaseItem {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  unit: string;
}

export interface PurchaseOrder {
  id: number;
  order_no: string;
  supplier_id: number;
  supplier_name: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  items: PurchaseItem[];
}

interface PurchaseStore {
  orders: PurchaseOrder[];
  loading: boolean;
  error: string | null;
  fetch: (status?: string) => Promise<void>;
  create: (data: { supplier_id: number; items: Array<{ product_id: number; quantity: number; unit_price: number }> }) => Promise<void>;
  updateStatus: (id: number, status: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetch: async (status?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await purchasesApi.list({ status });
      set({ orders: res.data.data, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  create: async (data) => {
    await purchasesApi.create(data);
    await get().fetch();
  },

  updateStatus: async (id, status) => {
    await purchasesApi.updateStatus(id, status);
    await get().fetch();
  },

  remove: async (id) => {
    await purchasesApi.remove(id);
    await get().fetch();
  },
}));
