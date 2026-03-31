import { create } from 'zustand';
import { productsApi } from '../lib/api';

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

interface ProductStore {
  items: Product[];
  loading: boolean;
  error: string | null;
  fetch: (search?: string, category?: string) => Promise<void>;
  create: (data: Partial<Product>) => Promise<void>;
  update: (id: number, data: Partial<Product>) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetch: async (search?: string, category?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await productsApi.list({ search, category });
      set({ items: res.data.data, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  create: async (data) => {
    await productsApi.create(data);
    await get().fetch();
  },

  update: async (id, data) => {
    await productsApi.update(id, data);
    await get().fetch();
  },

  remove: async (id) => {
    await productsApi.remove(id);
    await get().fetch();
  },
}));
