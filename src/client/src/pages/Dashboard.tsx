import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  productsApi, suppliersApi, customersApi, purchasesApi, salesApi, inventoryApi,
} from '../lib/api';
import { Download, Upload, BarChart3 } from 'lucide-react';

interface Stats {
  products: number;
  suppliers: number;
  customers: number;
  totalPurchaseAmount: number;
  totalSalesAmount: number;
  lowStockCount: number;
}

interface SalesOrder {
  id: number;
  order_no: string;
  total_amount: number;
  created_at: string;
  items: Array<{ product_name?: string; quantity: number; unit_price: number }>;
}

interface LowStockProduct {
  id: number;
  name: string;
  code: string;
  stock: number;
  min_stock: number;
}

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const statCards = [
  {
    label: '商品总数',
    getValue: (s: Stats) => s.products,
    color: 'blue',
    gradient: 'bg-gradient-primary',
    shadow: 'shadow-stat-blue',
    icon: (
      <svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    to: '/products',
  },
  {
    label: '供应商',
    getValue: (s: Stats) => s.suppliers,
    color: 'green',
    gradient: 'bg-gradient-success',
    shadow: 'shadow-stat-green',
    icon: (
      <svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    to: '/suppliers',
  },
  {
    label: '客户',
    getValue: (s: Stats) => s.customers,
    color: 'purple',
    gradient: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    shadow: 'shadow-stat-purple',
    icon: (
      <svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    to: '/customers',
  },
  {
    label: '采购总额',
    getValue: (s: Stats) => `¥${s.totalPurchaseAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    color: 'amber',
    gradient: 'bg-gradient-warning',
    shadow: 'shadow-stat-amber',
    icon: (
      <svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
    to: '/purchases',
  },
  {
    label: '销售总额',
    getValue: (s: Stats) => `¥${s.totalSalesAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    color: 'teal',
    gradient: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    shadow: 'shadow-stat-teal',
    icon: (
      <svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    to: '/sales',
  },
  {
    label: '库存预警',
    getValue: (s: Stats) => s.lowStockCount,
    color: 'red',
    gradient: 'bg-gradient-danger',
    shadow: 'shadow-stat-red',
    icon: (
      <svg className="w-6 h-6 text-white/90" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    to: '/inventory',
  },
];

const formatMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    products: 0, suppliers: 0, customers: 0,
    totalPurchaseAmount: 0, totalSalesAmount: 0, lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [salesTrend, setSalesTrend] = useState<Array<{ month: string; 销售额: number }>>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [topProducts, setTopProducts] = useState<Array<{ name: string; 销售额: number }>>([]);

  useEffect(() => {
    Promise.all([
      productsApi.list(),
      suppliersApi.list(),
      customersApi.list(),
      purchasesApi.list(),
      salesApi.list(),
      inventoryApi.lowStock(),
    ]).then(([p, s, c, po, so, inv]) => {
      const purchases = (po.data.data ?? []) as Array<{ total_amount: number }>;
      const sales = (so.data.data ?? []) as SalesOrder[];
      const lowStock = (inv.data.data ?? []) as LowStockProduct[];

      setStats({
        products: (p.data.data ?? []).length,
        suppliers: (s.data.data ?? []).length,
        customers: (c.data.data ?? []).length,
        totalPurchaseAmount: purchases.reduce((a, b) => a + b.total_amount, 0),
        totalSalesAmount: sales.reduce((a, b) => a + b.total_amount, 0),
        lowStockCount: lowStock.length,
      });

      // Build sales trend by month
      const trendMap: Record<string, number> = {};
      sales.forEach((order) => {
        const month = formatMonth(order.created_at);
        trendMap[month] = (trendMap[month] ?? 0) + order.total_amount;
      });
      const sortedMonths = Object.keys(trendMap).sort();
      setSalesTrend(sortedMonths.map((m) => ({ month: m, 销售额: Math.round(trendMap[m]) })));

      // Build top products by revenue
      const prodMap: Record<string, number> = {};
      sales.forEach((order) => {
        order.items.forEach((item) => {
          const name = item.product_name ?? '未知商品';
          const revenue = item.quantity * item.unit_price;
          prodMap[name] = (prodMap[name] ?? 0) + revenue;
        });
      });
      const top = Object.entries(prodMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, 销售额]) => ({ name, 销售额: Math.round(销售额) }));
      setTopProducts(top);

      // Low stock
      setLowStockProducts(lowStock.slice(0, 8));

      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">仪表盘</h1>
          <p className="page-subtitle">欢迎回来，系统整体运行状态良好</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                  <div className="h-6 w-20 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {statCards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="card-hover p-5 flex items-center gap-4 group"
              >
                <div className={`w-13 h-13 w-[52px] rounded-2xl ${card.gradient} ${card.shadow} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-500 font-medium">{card.label}</p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-0.5 tracking-tight">{card.getValue(stats)}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          {/* Charts Row */}
          {!loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Sales Trend Line Chart */}
              <div className="card p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">月度销售趋势</h3>
                {salesTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={salesTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [`¥${Number(v).toLocaleString()}`, '销售额']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Line type="monotone" dataKey="销售额" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">暂无销售数据</div>
                )}
              </div>

              {/* Low Stock Bar Chart */}
              <div className="card p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">库存预警商品</h3>
                {lowStockProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={lowStockProducts} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v, name) => [v, name === 'stock' ? '当前库存' : '最低库存']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Bar dataKey="stock" fill="#ef4444" radius={[4, 4, 0, 0]} name="当前库存" />
                      <Bar dataKey="min_stock" fill="#fca5a5" radius={[4, 4, 0, 0]} name="最低库存" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">暂无预警数据</div>
                )}
              </div>
            </div>
          )}

          {/* Top Products Pie Chart + Quick Actions */}
          {!loading && topProducts.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="card p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">热销产品（按销售额）</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={topProducts}
                      dataKey="销售额"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {topProducts.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`¥${Number(v).toLocaleString()}`, '销售额']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Actions */}
              <div className="card p-5 lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  快速操作
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Link to="/products" className="btn btn-primary gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    商品管理
                  </Link>
                  <Link to="/purchases" className="btn btn-secondary gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    新建采购
                  </Link>
                  <Link to="/sales" className="btn btn-secondary gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    新建销售
                  </Link>
                  <Link to="/inventory" className="btn btn-secondary gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    查看库存
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Summary strip */}
          <div className="mt-2 grid grid-cols-3 gap-4">
            {[
              { label: '今日采购', value: '—', Icon: Download, color: 'text-amber-600' },
              { label: '今日销售', value: '—', Icon: Upload, color: 'text-teal-600' },
              { label: '净利润', value: '—', Icon: BarChart3, color: 'text-primary-600' },
            ].map(item => (
              <div key={item.label} className="card p-4 text-center">
                <div className={`mb-1 flex justify-center ${item.color}`}><item.Icon className="w-6 h-6" /></div>
                <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                <p className={`text-lg font-bold mt-1 ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
