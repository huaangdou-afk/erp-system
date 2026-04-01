import { create } from 'zustand';
import { customersApi } from '../lib/api';
import { toast } from 'sonner';

export interface Customer {
  id: number;
  code: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  created_at: string;
}

interface CustomerStore {
  items: Customer[];
  loading: boolean;
  error: string | null;
  fetch: (search?: string) => Promise<void>;
  create: (data: Partial<Customer>) => Promise<void>;
  update: (id: number, data: Partial<Customer>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useCustomerStore = create<CustomerStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetch: async (search?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await customersApi.list({ search });
      set({ items: res.data.data ?? [], loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  create: async (data) => {
    try {
      await customersApi.create(data as any);
      toast.success('客户创建成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`客户创建失败: ${(e as Error).message}`);
    }
  },

  update: async (id, data) => {
    try {
      await customersApi.update(id, data);
      toast.success('客户更新成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`客户更新失败: ${(e as Error).message}`);
    }
  },

  remove: async (id) => {
    try {
      await customersApi.remove(id);
      toast.success('客户删除成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`客户删除失败: ${(e as Error).message}`);
    }
  },
}));
