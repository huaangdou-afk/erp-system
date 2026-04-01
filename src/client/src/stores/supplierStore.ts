import { create } from 'zustand';
import { suppliersApi } from '../lib/api';
import { toast } from 'sonner';

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  created_at: string;
}

interface SupplierStore {
  items: Supplier[];
  loading: boolean;
  error: string | null;
  fetch: (search?: string) => Promise<void>;
  create: (data: Partial<Supplier>) => Promise<void>;
  update: (id: number, data: Partial<Supplier>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useSupplierStore = create<SupplierStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetch: async (search?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await suppliersApi.list({ search });
      set({ items: res.data.data ?? [], loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  create: async (data) => {
    try {
      await suppliersApi.create(data as any);
      toast.success('供应商创建成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`供应商创建失败: ${(e as Error).message}`);
    }
  },

  update: async (id, data) => {
    try {
      await suppliersApi.update(id, data);
      toast.success('供应商更新成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`供应商更新失败: ${(e as Error).message}`);
    }
  },

  remove: async (id) => {
    try {
      await suppliersApi.remove(id);
      toast.success('供应商删除成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`供应商删除失败: ${(e as Error).message}`);
    }
  },
}));
