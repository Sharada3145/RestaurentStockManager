import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ClipboardList, Package, TrendingUp,
  BarChart2, ScanSearch, Layers, ChefHat, Zap,
  Activity, ShieldCheck, Sparkles, LogOut, History
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/', label: 'Operations', icon: LayoutDashboard },
  { id: 'entry', path: '/entry', label: 'Intake', icon: ClipboardList },
  { id: 'inventory', path: '/inventory', label: 'Stock', icon: Package },
  { id: 'team', path: '/team', label: 'Chef', icon: History },
  { id: 'forecasts', path: '/forecasts', label: 'AI', icon: TrendingUp },
  { id: 'analytics', path: '/analytics', label: 'Data', icon: BarChart2 },
  { id: 'unmapped', path: '/unmapped', label: 'Review', icon: ScanSearch },
  { id: 'ingredients', path: '/ingredients', label: 'Catalog', icon: Layers },
];

export function Sidebar({ activePage }) {
  const { counters, health } = useDashboard();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const badge = (id) => {
    if (id === 'unmapped' && counters.unmappedCount > 0) return counters.unmappedCount;
    if (id === 'inventory' && counters.alerts > 0) return counters.alerts;
    return null;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden xl:flex flex-col w-80 shrink-0 border-r border-luxury-border bg-luxury-cream/80 backdrop-blur-3xl relative z-20 shadow-xl">
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
            const isActive = location.pathname === item.path;
            const count = badge(item.id);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`nav-item group w-full flex items-center gap-5 py-4.5 px-8 relative overflow-hidden transition-all duration-500 ${isActive ? 'nav-item-active shadow-premium' : 'hover:translate-x-1'}`}
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

        {/* Bottom Section: Health & Logout */}
        <div className="px-8 py-10 space-y-6">
          {/* System Health */}
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
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl border border-luxury-border bg-white/50 text-luxury-text-secondary hover:bg-status-danger/5 hover:text-status-danger hover:border-status-danger/20 transition-all duration-300 font-bold text-[10px] uppercase tracking-widest"
          >
            <LogOut size={16} />
            <span>Sign Out Platform</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-2xl border-t border-luxury-border px-4 h-20 flex items-center justify-around shadow-2xl safe-area-bottom">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path;
          const count = badge(item.id);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full relative transition-all duration-300 ${isActive ? 'text-luxury-gold' : 'text-luxury-text-muted'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavMobile"
                  className="absolute top-0 left-1/4 right-1/4 h-1 bg-luxury-gold rounded-b-full shadow-gold"
                />
              )}
              <item.icon size={20} className={isActive ? 'scale-110' : ''} />
              <span className="text-[9px] font-black uppercase tracking-widest">{item.label.split(' ')[0]}</span>
              {count != null && (
                <span className="absolute top-3 right-1/4 w-4 h-4 bg-status-danger text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-sm">
                  {count}
                </span>
              )}
            </button>
          );
        })}
        {/* Mobile Logout (Replacing More) */}
        <button
           onClick={handleLogout}
           className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full text-luxury-text-muted`}
        >
          <LogOut size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">Exit</span>
        </button>
      </nav>
    </>
  );
}
