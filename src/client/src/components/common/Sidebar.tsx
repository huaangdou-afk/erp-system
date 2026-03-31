import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: '仪表盘', icon: '📊' },
  { to: '/products', label: '商品管理', icon: '📦' },
  { to: '/suppliers', label: '供应商管理', icon: '🏭' },
  { to: '/customers', label: '客户管理', icon: '👥' },
  { to: '/purchases', label: '采购管理', icon: '🛒' },
  { to: '/sales', label: '销售管理', icon: '💰' },
  { to: '/inventory', label: '库存查询', icon: '📋' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-slate-800 text-white flex flex-col shrink-0 h-full">
      {/* Brand / Logo */}
      <div className="px-5 py-5 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-md flex-shrink-0">
            <span className="text-sm font-bold text-white">S</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">SimpleERP</h1>
            <p className="text-xs text-slate-400 leading-tight">进销存管理系统</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5">
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">导航菜单</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white hover:translate-x-0.5'
              }`
            }
          >
            <span className="text-base leading-none opacity-80 group-hover:opacity-100">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Info */}
      <div className="px-4 py-4 border-t border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-semibold text-slate-200 flex-shrink-0">
            管
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">系统管理员</p>
            <p className="text-xs text-slate-500 truncate">admin@simpleerp.cn</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm flex-shrink-0" title="在线" />
        </div>
        <p className="mt-3 text-center text-xs text-slate-600">v1.0.0 &mdash; SimpleERP</p>
      </div>
    </aside>
  );
}
