import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { Toast }   from './components/Toast';
import { DashboardPage }   from './pages/DashboardPage';
import { StockEntryPage }  from './pages/StockEntryPage';
import { InventoryPage }   from './pages/InventoryPage';
import { UnmappedPage }    from './pages/UnmappedPage';
import { ForecastsPage }   from './pages/ForecastsPage';
import { AnalyticsPage }   from './pages/AnalyticsPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { useDashboard }    from './context/DashboardContext';
import { RefreshCw, Calendar, User, Bell, ChevronRight } from 'lucide-react';
import {
  postEntry,
  postInventory,
  postMap,
  postRestock,
  postIngredient,
} from './services/api';

const PAGE_TITLES = {
  dashboard:   'Kitchen Operations',
  entry:       'Stock Intake',
  inventory:   'Inventory Management',
  forecasts:   'Usage Predictions',
  analytics:   'Performance Analytics',
  unmapped:    'Review Queue',
  ingredients: 'Ingredient Catalogue',
};

export default function App() {
  const [page, setPage]     = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  const { refreshDashboard, addPendingEntry, optimisticIncrement, health } = useDashboard();

  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());
  }, []);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const notify = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── API handlers ──────────────────────────────────────────────────────────
  const handleSubmitEntry = useCallback(async (payload) => {
    try {
      const data = await postEntry(payload);
      const mapped   = data.results.filter((r) => r.status === 'mapped').length;
      const unmapped = data.results.filter((r) => r.status === 'unmapped').length;
      notify(`✅ ${mapped} item${mapped !== 1 ? 's' : ''} logged${unmapped ? `, ${unmapped} unmapped` : ''}`);
      addPendingEntry(data.results.map((r) => ({ ...r, chef_name: payload.chef_name })));
      if (unmapped > 0) optimisticIncrement('unmappedCount', unmapped);
      refreshDashboard({ silent: true });
      return data;
    } catch (err) {
      notify(err?.response?.data?.detail || 'Submission failed', 'error');
      throw err;
    }
  }, [notify, addPendingEntry, optimisticIncrement, refreshDashboard]);

  const handleUpdateInventory = useCallback(async (payload) => {
    try {
      const data = await postInventory(payload);
      notify(`📦 ${data.ingredient} updated to ${data.current_stock.toFixed(2)} ${data.unit}`);
      refreshDashboard({ silent: true });
      return data;
    } catch (err) {
      notify(err?.response?.data?.detail || 'Update failed', 'error');
      throw err;
    }
  }, [notify, refreshDashboard]);

  const handleRestock = useCallback(async (payload) => {
    try {
      const data = await postRestock(payload);
      notify(`🔄 Restocked ${data.ingredient}: +${payload.quantity} ${data.unit}`);
      refreshDashboard({ silent: true });
      return data;
    } catch (err) {
      notify(err?.response?.data?.detail || 'Restock failed', 'error');
      throw err;
    }
  }, [notify, refreshDashboard]);

  const handleMapUnmapped = useCallback(async (unmappedId, ingredientName) => {
    try {
      await postMap(unmappedId, ingredientName);
      notify(`🧠 Mapped & model retrained → ${ingredientName}`);
      optimisticIncrement('unmappedCount', -1);
      refreshDashboard({ silent: true });
    } catch (err) {
      notify(err?.response?.data?.detail || 'Mapping failed', 'error');
      throw err;
    }
  }, [notify, optimisticIncrement, refreshDashboard]);

  const handleAddIngredient = useCallback(async (payload) => {
    try {
      const data = await postIngredient(payload);
      notify(`🌿 Added ingredient: ${data.name}`);
      refreshDashboard({ silent: true });
      return data;
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to add ingredient', 'error');
      throw err;
    }
  }, [notify, refreshDashboard]);

  // ── Page renderer ─────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardPage onRefresh={refreshDashboard} notify={notify} />;
      case 'entry':
        return <StockEntryPage onSubmit={handleSubmitEntry} notify={notify} />;
      case 'inventory':
        return <InventoryPage onUpdate={handleUpdateInventory} onRestock={handleRestock} />;
      case 'forecasts':
        return <ForecastsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'unmapped':
        return <UnmappedPage onMap={handleMapUnmapped} />;
      case 'ingredients':
        return <IngredientsPage onAdd={handleAddIngredient} />;
      default:
        return <DashboardPage onRefresh={refreshDashboard} notify={notify} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-luxury-cream text-luxury-text-primary">
      {/* Sidebar */}
      <Sidebar activePage={page} onNavigate={setPage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Decorative Top Background Accent */}
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-luxury-gold/5 to-transparent pointer-events-none" />

        {/* Top Header */}
        <header className="h-24 shrink-0 border-b border-luxury-border bg-white/40 backdrop-blur-2xl flex items-center justify-between px-10 z-10">
          <div className="flex items-center gap-8">
             <div className="hidden lg:flex items-center gap-3 text-luxury-text-muted">
                <Calendar size={18} className="text-luxury-gold" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{currentDate}</span>
             </div>
             <div className="h-6 w-px bg-luxury-border hidden lg:block" />
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-luxury-gold uppercase tracking-[0.3em]">StockIQ</span>
                <ChevronRight size={14} className="text-luxury-border" />
                <h2 className="text-sm font-black text-luxury-text-primary uppercase tracking-[0.2em]">
                   {PAGE_TITLES[page]}
                </h2>
             </div>
          </div>

          <div className="flex items-center gap-6">
             <button 
                onClick={() => refreshDashboard()}
                className="p-3 rounded-2xl bg-white/60 border border-luxury-border text-luxury-text-muted hover:text-luxury-gold hover:border-luxury-gold/30 transition-all active:scale-95 shadow-sm"
                title="Refresh Intelligence"
             >
                <RefreshCw size={20} />
             </button>
             
             <div className="h-8 w-px bg-luxury-border" />

             <div className="flex items-center gap-4 pl-2">
                <div className="text-right hidden sm:block">
                   <p className="text-xs font-black text-luxury-text-primary uppercase tracking-tighter">Executive Chef</p>
                   <div className="flex items-center justify-end gap-2">
                      <div className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-status-success' : 'bg-status-danger'}`} />
                      <p className="text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest">Verified Console</p>
                   </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-luxury-gradient p-0.5 shadow-gold hover:scale-105 transition-transform cursor-pointer">
                   <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
                      <User size={22} className="text-luxury-gold" />
                   </div>
                </div>
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
          <div className="mx-auto max-w-[1400px] px-10 py-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-10 right-10 z-50 flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              onDismiss={() => dismissToast(t.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
