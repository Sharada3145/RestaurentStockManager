import { motion } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, Package, TrendingUp,
  BarChart2, ScanSearch, Layers, ChefHat, Zap,
  Activity, Settings, HelpCircle, Sparkles, ShieldCheck
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Operations',    icon: LayoutDashboard },
  { id: 'entry',       label: 'Stock Intake',  icon: ClipboardList   },
  { id: 'inventory',   label: 'Inventory',     icon: Package          },
  { id: 'forecasts',   label: 'Predictions',   icon: TrendingUp       },
  { id: 'analytics',   label: 'Analytics',     icon: BarChart2        },
  { id: 'unmapped',    label: 'Review Queue',  icon: ScanSearch       },
  { id: 'ingredients', label: 'Catalogue',     icon: Layers           },
];

export function Sidebar({ activePage, onNavigate }) {
  const { counters, health } = useDashboard();

  const badge = (id) => {
    if (id === 'unmapped'  && counters.unmappedCount > 0) return counters.unmappedCount;
    if (id === 'inventory' && counters.alerts > 0)        return counters.alerts;
    return null;
  };

  return (
    <aside className="hidden md:flex flex-col w-80 shrink-0 border-r border-luxury-border bg-luxury-cream/80 backdrop-blur-3xl relative z-20 shadow-xl">
      {/* Logo Section */}
      <div className="flex flex-col gap-3 px-10 py-12">
        <div className="flex items-center gap-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-[22px] bg-luxury-gradient shadow-gold-lg relative group cursor-pointer">
            <ChefHat size={28} className="text-white group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1">
               <Sparkles size={16} className="text-luxury-gold animate-pulse" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-luxury-text-primary tracking-tighter gradient-text">StockIQ</h1>
            <p className="text-[10px] text-luxury-gold font-black uppercase tracking-[0.3em] opacity-80 italic">Operational Luxury</p>
          </div>
        </div>
        <div className="mt-8 flex items-center gap-3 px-4 py-2 rounded-full bg-luxury-gold/5 border border-luxury-gold/10 w-fit">
           <ShieldCheck size={12} className="text-luxury-gold" />
           <span className="text-[9px] font-black text-luxury-gold uppercase tracking-widest">Enterprise Console</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-5 py-6 space-y-3 overflow-y-auto custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          const count    = badge(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item group flex items-center gap-5 py-4.5 px-8 relative overflow-hidden transition-all duration-500 ${isActive ? 'nav-item-active shadow-premium' : 'hover:translate-x-1'}`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute left-0 top-0 bottom-0 w-1.5 bg-luxury-gold shadow-gold z-10"
                />
              )}
              <item.icon 
                size={22} 
                className={`shrink-0 transition-all duration-500 ${isActive ? 'text-luxury-gold scale-110' : 'text-luxury-text-muted group-hover:text-luxury-gold group-hover:scale-110'}`} 
              />
              <span className={`flex-1 text-left font-black text-xs uppercase tracking-widest ${isActive ? 'text-luxury-text-primary' : 'text-luxury-text-secondary group-hover:text-luxury-text-primary'}`}>
                {item.label}
              </span>
              {count != null && (
                <span className={`text-[10px] font-black rounded-lg px-3 py-1.5 min-w-[28px] text-center shadow-sm transition-all duration-500 group-hover:scale-110
                  ${item.id === 'inventory'
                    ? 'bg-status-warning/10 text-status-warning border border-status-warning/20'
                    : 'bg-status-danger/10 text-status-danger border border-status-danger/20'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Health */}
      <div className="px-8 py-10">
        <div className="flex flex-col gap-6 rounded-[32px] bg-white shadow-premium p-8 border border-luxury-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rotate-6 pointer-events-none">
             <Zap size={64} className="text-luxury-gold" />
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
               <div className={`w-3.5 h-3.5 rounded-full ${health?.status === 'ok' ? 'bg-status-success shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-status-danger shadow-[0_0_12px_rgba(239,68,68,0.5)]'}`} />
               {health?.status === 'ok' && <div className="absolute inset-0 w-3.5 h-3.5 rounded-full bg-status-success animate-ping opacity-75" />}
            </div>
            <div className="space-y-0.5">
               <p className="text-[11px] font-black text-luxury-text-primary uppercase tracking-[0.2em]">
                 {health?.status === 'ok' ? 'Operations Stable' : 'Action Required'}
               </p>
               <p className="text-[9px] font-bold text-luxury-text-muted uppercase tracking-widest">Global Sync Active</p>
            </div>
          </div>
          
          <div className="space-y-4 pt-6 border-t border-luxury-border relative z-10">
             <div className="flex justify-between items-center">
                <span className="text-[10px] text-luxury-text-muted font-black uppercase tracking-widest">Inventory Assets</span>
                <span className="text-[10px] text-luxury-text-primary font-black tabular-nums">{health?.ingredient_count || 0}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-[10px] text-luxury-text-muted font-black uppercase tracking-widest">Cognitive Engine</span>
                <span className="text-[10px] text-luxury-text-primary font-black">v{health?.version || '3.2.0'}</span>
             </div>
             
             <div className="pt-2">
                <div className="h-1.5 w-full bg-luxury-cream rounded-full overflow-hidden border border-luxury-border shadow-inner">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: '100%' }}
                     transition={{ duration: 2 }}
                     className="h-full bg-luxury-gradient" 
                   />
                </div>
             </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
