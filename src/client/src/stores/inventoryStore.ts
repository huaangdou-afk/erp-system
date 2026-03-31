import { create } from 'zustand';
import { inventoryApi } from '../lib/api';
import { Product } from './productStore';

interface InventoryStore {
  items: Product[];
  lowStockItems: Product[];
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  fetchLowStock: () => Promise<void>;
}

export const useInventoryStore = create<InventoryStore>((set) => ({
  items: [],
  lowStockItems: [],
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await inventoryApi.list();
      set({ items: res.data.data, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchLowStock: async () => {
    set({ loading: true, error: null });
    try {
      const res = await inventoryApi.lowStock();
      set({ lowStockItems: res.data.data, loading: false });
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false });
    }
  },
}));
