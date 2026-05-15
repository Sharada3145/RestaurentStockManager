import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  getActivity, getAllForecasts, getHealth,
  getInventory, getUnmapped, getUsage, getTodayBatches, deleteUnmapped
} from '../services/api';

const DashboardCtx = createContext(null);

const POLL_INTERVAL = 30_000;

export function DashboardProvider({ children }) {
  const [health,     setHealth]     = useState(null);
  const [inventory,  setInventory]  = useState([]);
  const [usage,      setUsage]      = useState({ total_usage: {}, by_chef: {} });
  const [forecasts,  setForecasts]  = useState([]);
  const [unmapped,   setUnmapped]   = useState([]);
  const [activity,   setActivity]   = useState([]);
  const [todayBatches, setTodayBatches] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

  const [counters, setCounters] = useState({
    totalTracked:   0,
    alerts:         0,
    unmappedCount:  0,
    todayPurchased: 0,
    todayUsed:      0,
  });

  const [pendingEntries,     setPendingEntries]     = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');

  const pollTimer = useRef(null);

  const fetchAll = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);
    setError(null);

    try {
      const [h, i, uAll, uToday, fc, um, act, batches] = await Promise.allSettled([
        getHealth(),
        getInventory(),
        getUsage(),
        getUsage(1),
        getAllForecasts(),
        getUnmapped(),
        getActivity(20),
        getTodayBatches(),
      ]);

      const updates = {};

      if (h.status  === 'fulfilled') setHealth(h.value);
      if (i.status  === 'fulfilled') {
        const invData = i.value || [];
        setInventory(invData);
        updates.alerts = invData.filter((item) => item.alert).length;
      }
      if (uAll.status === 'fulfilled') {
        setUsage(uAll.value || { total_usage: {}, by_chef: {} });
        const total = Object.values(uAll.value?.total_usage || {}).reduce((a, b) => a + Number(b || 0), 0);
        updates.totalTracked = Math.round(total * 10) / 10;
      }
      if (uToday.status === 'fulfilled') {
        const todayTotal = Object.values(uToday.value?.total_usage || {}).reduce((a, b) => a + Number(b || 0), 0);
        updates.todayUsed = todayTotal;
      }
      if (fc.status === 'fulfilled') setForecasts(fc.value || []);
      if (um.status === 'fulfilled') {
        const umData = um.value || [];
        setUnmapped(umData);
        updates.unmappedCount = umData.length;
      }
      if (act.status === 'fulfilled') {
        setActivity(act.value || []);
        setPendingEntries([]);
      }
      if (batches.status === 'fulfilled') {
        const batchData = batches.value || [];
        setTodayBatches(batchData);
        updates.todayPurchased = batchData.reduce((acc, b) => acc + Number(b.purchased_quantity || 0), 0);
      }

      setCounters((prev) => ({ ...prev, ...updates }));

    } catch (err) {
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    pollTimer.current = setInterval(() => fetchAll({ silent: true }), POLL_INTERVAL);
    return () => clearInterval(pollTimer.current);
  }, [fetchAll]);

  const optimisticIncrement = useCallback((key, amount = 1) => {
    setCounters((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) + amount) }));
  }, []);

  const addPendingEntry = useCallback((entries) => {
    const now = new Date().toISOString();
    const items = entries.map((e, i) => ({
      id:             -(Date.now() + i),
      ingredient:     e.ingredient     || 'unknown',
      chef_name:      e.chef_name      || '',
      quantity:       e.quantity,
      unit:           e.unit,
      confidence:     e.confidence,
      mapping_method: e.mapping_method || 'ml',
      needs_review:   e.needs_review,
      raw_text:       e.cleaned_text,
      logged_at:      now,
    }));
    setActivity((prev) => [...items, ...prev].slice(0, 20));
  }, []);

  const refreshDashboard = useCallback((opts) => fetchAll(opts), [fetchAll]);

  const removeUnmapped = useCallback(async (id) => {
    try {
      await deleteUnmapped(id);
      setUnmapped((prev) => prev.filter((item) => item.id !== id));
      setCounters((prev) => ({ ...prev, unmappedCount: Math.max(0, prev.unmappedCount - 1) }));
    } catch (err) {
      console.error('Failed to delete unmapped entry:', err);
    }
  }, []);

  const value = {
    health,
    inventory,
    usage,
    forecasts,
    unmapped,
    activity,
    todayBatches,
    counters,
    loading,
    refreshing,
    error,
    pendingEntries,
    selectedIngredient,
    setSelectedIngredient,
    refreshDashboard,
    optimisticIncrement,
    addPendingEntry,
    removeUnmapped,
  };

  return <DashboardCtx.Provider value={value}>{children}</DashboardCtx.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardCtx);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
