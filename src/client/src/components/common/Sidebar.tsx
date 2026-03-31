import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/products', label: '商品管理', icon: '📦' },
  { to: '/suppliers', label: '供应商', icon: '🏭' },
  { to: '/customers', label: '客户', icon: '👥' },
  { to: '/purchases', label: '采购管理', icon: '🛒' },
  { to: '/sales', label: '销售管理', icon: '💰' },
  { to: '/inventory', label: '库存查询', icon: '📋' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-slate-800 text-white flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-slate-700">
        <h1 className="text-lg font-bold text-blue-400">SimpleERP</h1>
        <p className="text-xs text-slate-400 mt-0.5">进销存管理系统</p>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">v1.0.0</p>
      </div>
    </aside>
  );
}
