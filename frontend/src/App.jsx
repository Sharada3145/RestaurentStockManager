import { useState, useCallback } from 'react';
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
import {
  postEntry,
  postInventory,
  postMap,
  postRestock,
  postIngredient,
} from './services/api';

const PAGE_TITLES = {
  dashboard:   'Dashboard',
  entry:       'Stock Entry',
  inventory:   'Inventory',
  forecasts:   'Forecasts',
  analytics:   'Analytics',
  unmapped:    'Review Queue',
  ingredients: 'Ingredients',
};

export default function App() {
  const [page, setPage]     = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  const { refreshDashboard, addPendingEntry, optimisticIncrement } = useDashboard();

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
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* Sidebar */}
      <Sidebar activePage={page} onNavigate={setPage} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
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
