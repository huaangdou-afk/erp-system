import { useEffect, useState } from 'react';
import { useInventoryStore } from '../stores/inventoryStore';
import { Product } from '../stores/productStore';
import { ColumnDef } from '@tanstack/react-table';
import DataTable from '../components/common/DataTable';

type Tab = 'all' | 'low';

export default function InventoryPage() {
  const { items, lowStockItems, loading, fetch, fetchLowStock } = useInventoryStore();
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => { fetch(); fetchLowStock(); }, [fetch, fetchLowStock]);

  const columns: ColumnDef<Product, unknown>[] = [
    { accessorKey: 'code', header: '编码', size: 100 },
    { accessorKey: 'name', header: '名称' },
    { accessorKey: 'spec', header: '规格' },
    { accessorKey: 'category', header: '分类' },
    {
      accessorKey: 'stock', header: '当前库存',
      cell: (v) => {
        const stock = Number(v.getValue());
        const min = Number((v.row.original as Product).min_stock);
        if (min > 0 && stock < min) return <span className="text-red-500 font-semibold">{stock}</span>;
        return stock;
      },
    },
    { accessorKey: 'min_stock', header: '最低库存' },
    {
      accessorKey: 'stock', header: '状态',
      cell: (v) => {
        const stock = Number(v.getValue());
        const min = Number((v.row.original as Product).min_stock);
        if (min > 0 && stock < min) return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">库存不足</span>;
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">正常</span>;
      },
    },
    {
      accessorKey: 'purchase_price', header: '采购价',
      cell: (v) => `¥${Number(v.getValue()).toFixed(2)}`,
    },
    {
      accessorKey: 'sale_price', header: '销售价',
      cell: (v) => `¥${Number(v.getValue()).toFixed(2)}`,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">库存查询</h1>
      </div>

      <div className="flex gap-1 mb-4">
        <button
          className={`btn text-sm ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('all')}
        >
          全部库存 ({items.length})
        </button>
        <button
          className={`btn text-sm ${tab === 'low' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('low')}
        >
          库存预警 ({lowStockItems.length})
        </button>
      </div>

      {tab === 'low' && lowStockItems.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium mb-2">以下商品库存低于最低预警线：</p>
          <ul className="space-y-1">
            {lowStockItems.map(item => (
              <li key={item.id} className="text-sm text-red-600">
                <span className="font-medium">{item.name}</span> ({item.code}) —
                当前库存 <strong>{item.stock}</strong> / 最低 {item.min_stock}，还差 {item.min_stock - item.stock}
              </li>
            ))}
          </ul>
        </div>
      )}

      <DataTable
        columns={columns}
        data={tab === 'all' ? items : lowStockItems}
        loading={loading}
        searchPlaceholder="搜索库存..."
      />
    </div>
  );
}
