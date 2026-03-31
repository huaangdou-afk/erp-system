import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, suppliersApi, customersApi, purchasesApi, salesApi, inventoryApi } from '../lib/api';

interface Stats {
  products: number;
  suppliers: number;
  customers: number;
  totalPurchaseAmount: number;
  totalSalesAmount: number;
  lowStockCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    products: 0, suppliers: 0, customers: 0,
    totalPurchaseAmount: 0, totalSalesAmount: 0, lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsApi.list(),
      suppliersApi.list(),
      customersApi.list(),
      purchasesApi.list(),
      salesApi.list(),
      inventoryApi.lowStock(),
    ]).then(([p, s, c, po, so, inv]) => {
      const purchases = po.data.data as Array<{ total_amount: number }>;
      const sales = so.data.data as Array<{ total_amount: number }>;
      setStats({
        products: p.data.data.length,
        suppliers: s.data.data.length,
        customers: c.data.data.length,
        totalPurchaseAmount: purchases.reduce((a, b) => a + b.total_amount, 0),
        totalSalesAmount: sales.reduce((a, b) => a + b.total_amount, 0),
        lowStockCount: inv.data.data.length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: '商品总数', value: stats.products, color: 'bg-blue-500', icon: '📦', to: '/products' },
    { label: '供应商', value: stats.suppliers, color: 'bg-emerald-500', icon: '🏭', to: '/suppliers' },
    { label: '客户', value: stats.customers, color: 'bg-purple-500', icon: '👥', to: '/customers' },
    { label: '采购总额', value: `¥${stats.totalPurchaseAmount.toFixed(2)}`, color: 'bg-amber-500', icon: '🛒', to: '/purchases' },
    { label: '销售总额', value: `¥${stats.totalSalesAmount.toFixed(2)}`, color: 'bg-teal-500', icon: '💰', to: '/sales' },
    { label: '库存预警', value: stats.lowStockCount, color: 'bg-red-500', icon: '⚠️', to: '/inventory' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">仪表盘</h1>
      {loading ? (
        <p className="text-slate-400 animate-pulse">加载中...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {cards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center text-2xl text-white shrink-0`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-xl font-bold text-slate-800">{card.value}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold text-slate-700 mb-3">快速操作</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/products" className="btn btn-primary">商品管理</Link>
              <Link to="/purchases" className="btn btn-secondary">新建采购</Link>
              <Link to="/sales" className="btn btn-secondary">新建销售</Link>
              <Link to="/inventory" className="btn btn-secondary">查看库存</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
