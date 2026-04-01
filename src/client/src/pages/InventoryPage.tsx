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
      <div className="page-header">
        <div>
          <h1 className="page-title">库存查询</h1>
          <p className="page-subtitle">实时监控商品库存状态与预警信息</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn text-sm gap-1.5 ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('all')}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            全部 ({items.length})
          </button>
          <button
            className={`btn text-sm gap-1.5 ${tab === 'low' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setTab('low')}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            库存预警 ({lowStockItems.length})
          </button>
        </div>
      </div>

      {tab === 'low' && lowStockItems.length > 0 && (
        <div className="mb-4 p-4 bg-red-50/80 border border-red-200 rounded-xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-red-700 mb-2">以下商品库存低于最低预警线：</p>
            <ul className="space-y-1.5">
              {lowStockItems.map(item => (
                <li key={item.id} className="text-sm text-red-600 flex items-center gap-2">
                  <span className="font-semibold min-w-[120px]">{item.name}</span>
                  <span className="text-red-400">({item.code})</span>
                  <span>当前库存 <strong>{item.stock}</strong> / 最低 {item.min_stock}，还差 <strong>{item.min_stock - item.stock}</strong></span>
                </li>
              ))}
            </ul>
          </div>
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
