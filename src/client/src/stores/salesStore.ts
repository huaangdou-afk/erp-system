import { create } from 'zustand';
import { salesApi, OrderItem } from '../lib/api';
import { toast } from 'sonner';

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
      set({ orders: res.data.data ?? [], loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  create: async (data) => {
    try {
      await salesApi.create(data);
      toast.success('销售单创建成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`销售单创建失败: ${(e as Error).message}`);
    }
  },

  updateStatus: async (id, status) => {
    try {
      await salesApi.updateStatus(id, status);
      toast.success('销售单状态更新成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`销售单状态更新失败: ${(e as Error).message}`);
    }
  },

  remove: async (id) => {
    try {
      await salesApi.remove(id);
      toast.success('销售单删除成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`销售单删除失败: ${(e as Error).message}`);
    }
  },
}));
