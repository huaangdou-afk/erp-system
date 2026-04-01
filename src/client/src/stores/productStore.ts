import { create } from 'zustand';
import { productsApi } from '../lib/api';
import { toast } from 'sonner';

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
      set({ items: res.data.data ?? [], loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  create: async (data) => {
    try {
      await productsApi.create(data as any);
      toast.success('商品创建成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`商品创建失败: ${(e as Error).message}`);
    }
  },

  update: async (id, data) => {
    try {
      await productsApi.update(id, data);
      toast.success('商品更新成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`商品更新失败: ${(e as Error).message}`);
    }
  },

  remove: async (id) => {
    try {
      await productsApi.remove(id);
      toast.success('商品删除成功');
      await get().fetch();
    } catch (e: unknown) {
      toast.error(`商品删除失败: ${(e as Error).message}`);
    }
  },
}));
