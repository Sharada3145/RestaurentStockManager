import { useState, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { StockEntryPage } from './pages/StockEntryPage';
import { InventoryPage } from './pages/InventoryPage';
import { UnmappedPage } from './pages/UnmappedPage';
import { ForecastsPage } from './pages/ForecastsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { IngredientsPage } from './pages/IngredientsPage';
import { ChefUsageOverview } from './pages/ChefUsageOverview';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { useDashboard }    from './context/DashboardContext';
import { RefreshCw, Calendar, User, ChevronRight } from 'lucide-react';
import {
  postEntry,
  postInventory,
  postMap,
  postRestock,
  postIngredient,
} from './services/api';

const PAGE_TITLES = {
  '/': 'Operations',
  '/entry': 'Stock Intake',
  '/inventory': 'Inventory',
  '/team': 'Chef Usage',
  '/forecasts': 'Predictions',
  '/analytics': 'Analytics',
  '/unmapped': 'Review',
  '/ingredients': 'Catalogue',
};

function AppLayout({ children, notify, refreshDashboard, health, toasts, dismissToast }) {
  const location = useLocation();
  const { user } = useAuth();
  const path = location.pathname;
  const title = PAGE_TITLES[path] || 'StockIQ';

  const currentDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }).format(new Date());
  }, []);

  return (
    <div className="flex flex-col xl:flex-row h-screen overflow-hidden bg-luxury-cream text-luxury-text-primary">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-48 xl:h-96 bg-gradient-to-b from-luxury-gold/5 to-transparent pointer-events-none" />

        <header className="h-20 xl:h-24 shrink-0 border-b border-luxury-border bg-white/40 backdrop-blur-2xl flex items-center justify-between px-6 xl:px-10 z-10">
          <div className="flex items-center gap-4 xl:gap-8">
            <div className="flex xl:hidden items-center justify-center w-10 h-10 rounded-xl bg-luxury-gradient shadow-gold text-white">
              <RefreshCw size={18} onClick={() => refreshDashboard()} />
            </div>
            
            <div className="hidden xl:flex items-center gap-3 text-luxury-text-muted">
              <Calendar size={18} className="text-luxury-gold" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{currentDate}</span>
            </div>
            <div className="h-6 w-px bg-luxury-border hidden xl:block" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-luxury-gold uppercase tracking-[0.3em] hidden sm:inline">StockIQ</span>
              <ChevronRight size={14} className="text-luxury-border hidden sm:inline" />
              <h2 className="text-sm font-black text-luxury-text-primary uppercase tracking-[0.2em]">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4 xl:gap-6">
            <button
              onClick={() => refreshDashboard()}
              className="hidden xl:flex p-3 rounded-2xl bg-white/60 border border-luxury-border text-luxury-text-muted hover:text-luxury-gold hover:border-luxury-gold/30 transition-all active:scale-95 shadow-sm"
            >
              <RefreshCw size={20} />
            </button>

            <div className="hidden xl:block h-8 w-px bg-luxury-border" />

            <div className="flex items-center gap-3 xl:gap-4 pl-0 xl:pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] xl:text-xs font-black text-luxury-text-primary uppercase tracking-tighter">{user?.name || 'User'}</p>
                <div className="flex items-center justify-end gap-1.5 xl:gap-2">
                  <div className={`w-1.5 h-1.5 xl:w-2 xl:h-2 rounded-full ${health?.status === 'ok' ? 'bg-status-success' : 'bg-status-danger'}`} />
                  <p className="text-[8px] xl:text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest">{user?.role || 'Guest'}</p>
                </div>
              </div>
              <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-xl xl:rounded-2xl bg-luxury-gradient p-0.5 shadow-gold hover:scale-105 transition-transform cursor-pointer">
                <div className="w-full h-full rounded-[10px] xl:rounded-[14px] bg-white flex items-center justify-center">
                  <User size={18} className="text-luxury-gold" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-0 pb-24 xl:pb-12">
          <div className="mx-auto max-w-[1400px] px-6 xl:px-10 py-8 xl:py-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <div className="fixed bottom-24 xl:bottom-10 right-6 xl:right-10 z-50 flex flex-col gap-4 pointer-events-none">
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

export default function App() {
  const [toasts, setToasts] = useState([]);
  const { refreshDashboard, addPendingEntry, optimisticIncrement, health } = useDashboard();

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSubmitEntry = useCallback(async (payload) => {
    try {
      const data = await postEntry(payload);
      const mapped = data.results.filter((r) => r.status === 'mapped').length;
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
      notify(`📦 ${data.ingredient} updated`);
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
      notify(`🔄 Restocked ${data.ingredient}`);
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
      notify(`🧠 Mapped → ${ingredientName}`);
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
      notify(`🌿 Added: ${data.name}`);
      refreshDashboard({ silent: true });
      return data;
    } catch (err) {
      notify(err?.response?.data?.detail || 'Failed to add', 'error');
      throw err;
    }
  }, [notify, refreshDashboard]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/" element={
        <ProtectedRoute allowedRoles={['admin', 'manager', 'chef']}>
          <AppLayout notify={notify} refreshDashboard={refreshDashboard} health={health} toasts={toasts} dismissToast={dismissToast}>
            <DashboardPage onRefresh={refreshDashboard} notify={notify} onRestock={handleRestock} onUpdate={handleUpdateInventory} />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/entry" element={
        <ProtectedRoute allowedRoles={['admin', 'manager', 'chef']}>
          <AppLayout notify={notify} refreshDashboard={refreshDashboard} health={health} toasts={toasts} dismissToast={dismissToast}>
            <StockEntryPage onSubmit={handleSubmitEntry} notify={notify} />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/inventory" element={
        <ProtectedRoute allowedRoles={['admin', 'manager', 'chef']}>
          <AppLayout notify={notify} refreshDashboard={refreshDashboard} health={health} toasts={toasts} dismissToast={dismissToast}>
            <InventoryPage onUpdate={handleUpdateInventory} onRestock={handleRestock} />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/team" element={
        <ProtectedRoute allowedRoles={['admin', 'manager', 'chef']}>
          <AppLayout notify={notify} refreshDashboard={refreshDashboard} health={health} toasts={toasts} dismissToast={dismissToast}>
            <ChefUsageOverview />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/forecasts" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AppLayout notify={notify} refreshDashboard={refreshDashboard} health={health} toasts={toasts} dismissToast={dismissToast}>
            <ForecastsPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/analytics" element={
        <ProtectedRoute allowedRoles={['admin', 'manager', 'chef']}>
          <AppLayout notify={notify} refreshDashboard={refreshDashboard} health={health} toasts={toasts} dismissToast={dismissToast}>
            <AnalyticsPage />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/unmapped" element={
        <ProtectedRoute allowedRoles={['admin', 'manager']}>
          <AppLayout notify={notify} refreshDashboard={refreshDashboard} health={health} toasts={toasts} dismissToast={dismissToast}>
            <UnmappedPage onMap={handleMapUnmapped} />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/ingredients" element={
        <ProtectedRoute allowedRoles={['admin', 'manager', 'chef']}>
          <AppLayout notify={notify} refreshDashboard={refreshDashboard} health={health} toasts={toasts} dismissToast={dismissToast}>
            <IngredientsPage onAdd={handleAddIngredient} />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
