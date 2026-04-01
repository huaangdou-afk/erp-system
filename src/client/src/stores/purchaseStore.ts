import { create } from 'zustand';
import { purchasesApi, OrderItem } from '../lib/api';
import { toast } from 'sonner';

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
      set({ orders: res.data.data ?? [], loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  create: async (data) => {
    try {
      await purchasesApi.create(data);
      toast.success('采购单创建成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`采购单创建失败: ${(e as Error).message}`);
    }
  },

  updateStatus: async (id, status) => {
    try {
      await purchasesApi.updateStatus(id, status);
      toast.success('采购单状态更新成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`采购单状态更新失败: ${(e as Error).message}`);
    }
  },

  remove: async (id) => {
    try {
      await purchasesApi.remove(id);
      toast.success('采购单删除成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`采购单删除失败: ${(e as Error).message}`);
    }
  },
}));
