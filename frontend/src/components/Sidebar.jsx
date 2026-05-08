import { motion } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, Package, TrendingUp,
  BarChart2, ScanSearch, Layers, ChefHat, Zap
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'entry',       label: 'Stock Entry',  icon: ClipboardList   },
  { id: 'inventory',   label: 'Inventory',    icon: Package          },
  { id: 'forecasts',   label: 'Forecasts',    icon: TrendingUp       },
  { id: 'analytics',   label: 'Analytics',    icon: BarChart2        },
  { id: 'unmapped',    label: 'Review Queue', icon: ScanSearch       },
  { id: 'ingredients', label: 'Ingredients',  icon: Layers           },
];

export function Sidebar({ activePage, onNavigate }) {
  const { counters, health } = useDashboard();

  const badge = (id) => {
    if (id === 'unmapped'  && counters.unmappedCount > 0) return counters.unmappedCount;
    if (id === 'inventory' && counters.alerts > 0)        return counters.alerts;
    return null;
  };

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-white/[0.06] bg-surface-900/80 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-600 shadow-lg shadow-brand-600/30">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight">StockIQ</p>
          <p className="text-[10px] text-slate-500 font-medium">AI Kitchen Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          const count    = badge(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item w-full ${isActive ? 'active' : ''}`}
            >
              <item.icon size={16} className="shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {count != null && (
                <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center
                  ${item.id === 'inventory'
                    ? 'bg-accent-amber/20 text-accent-amber'
                    : 'bg-accent-rose/20 text-accent-rose'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer: system status */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 rounded-xl bg-surface-800/60 px-3 py-2.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${health?.status === 'ok' ? 'bg-accent-emerald animate-pulse' : 'bg-accent-rose'}`} />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">
              {health?.status === 'ok' ? 'System Online' : 'System Degraded'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {health ? `${health.ingredient_count} ingredients · v${health.version}` : 'Connecting…'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
