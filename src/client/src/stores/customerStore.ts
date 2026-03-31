import { create } from 'zustand';
import { customersApi } from '../lib/api';

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
      set({ items: res.data.data, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  create: async (data) => {
    await customersApi.create(data);
    await get().fetch();
  },

  update: async (id, data) => {
    await customersApi.update(id, data);
    await get().fetch();
  },

  remove: async (id) => {
    await customersApi.remove(id);
    await get().fetch();
  },
}));
