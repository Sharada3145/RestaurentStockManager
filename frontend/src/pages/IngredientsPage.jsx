import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Layers, Tag, X, ChevronDown, Loader2, Check,
  Target, UserCircle, Fingerprint, Sparkles, Coffee, Box, Trash2, Edit3
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useDashboard } from '../context/DashboardContext';
import { deleteIngredient } from '../services/api';
import { EmptyState } from '../components/EmptyState';

const CATEGORIES = ['all', 'grain', 'protein', 'vegetable', 'dairy', 'spice', 'oil', 'legume', 'fruit', 'sauce', 'dry', 'general'];
const UNITS = ['kg', 'liters', 'count', 'g', 'ml'];

function AddIngredientModal({ show, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('general');
  const [unit, setUnit] = useState('kg');
  const [threshold, setThreshold] = useState('1.0');
  const [aliasInput, setAliasInput] = useState('');
  const [aliases, setAliases] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addAlias = () => {
    const v = aliasInput.trim().toLowerCase();
    if (v && !aliases.includes(v)) { setAliases([...aliases, v]); }
    setAliasInput('');
  };

  const submit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setBusy(true);
    setError('');
    try {
      await onAdd({ name: name.trim().toLowerCase(), category, default_unit: unit, reorder_threshold: parseFloat(threshold) || 1.0, aliases });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.detail || 'Failed to add ingredient');
    } finally {
      setBusy(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {show && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-start justify-center bg-luxury-text-primary/60 backdrop-blur-md p-6 overflow-y-auto pt-12 pb-24"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            key="modal-panel"
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="glass-panel w-full max-w-xl p-12 space-y-10 shadow-gold-lg relative overflow-hidden bg-white/95 border-luxury-gold/10"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none rotate-12">
              <Layers size={180} className="text-luxury-gold" />
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-luxury-gold/10 border border-luxury-gold/20 flex items-center justify-center text-luxury-gold shadow-sm">
                  <Plus size={24} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-luxury-text-primary tracking-tight">New Catalog Entry</h2>
                  <p className="text-[10px] font-black text-luxury-gold uppercase tracking-[0.3em]">Module: Master Inventory</p>
                </div>
              </div>
              <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white border border-luxury-border flex items-center justify-center text-luxury-text-muted hover:text-luxury-text-primary transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-luxury-text-primary uppercase tracking-[0.2em] ml-1">Canonical Ingredient Identity</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: San Marzano Tomatoes"
                  className="input-premium h-16 text-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-luxury-text-muted uppercase tracking-[0.2em] ml-1">Classification</label>
                  <div className="relative">
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-premium h-14 appearance-none font-bold pr-10">
                      {CATEGORIES.filter(c => c !== 'all').map(c => (
                        <option key={c} value={c} className="text-luxury-text-primary">{c.toUpperCase()}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gold pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-luxury-text-muted uppercase tracking-[0.2em] ml-1">Standard Ledger Unit</label>
                  <div className="relative">
                    <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input-premium h-14 appearance-none font-bold pr-10">
                      {UNITS.map(u => <option key={u} value={u} className="text-luxury-text-primary">{u.toUpperCase()}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gold pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-luxury-text-muted uppercase tracking-[0.2em] ml-1">Priority Restock Floor</label>
                <div className="relative">
                  <input type="number" min="0" step="0.1" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="input-premium h-14 font-black text-lg pr-16 shadow-sm" />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-luxury-gold uppercase tracking-widest">{unit}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-luxury-text-muted uppercase tracking-[0.2em] ml-1">Operational Aliases</label>
                <div className="flex gap-4">
                  <input
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlias())}
                    placeholder="Ex: Roma, plum tomatoes..."
                    className="input-premium flex-1 h-14 font-bold"
                  />
                  <button onClick={addAlias} className="w-14 h-14 rounded-2xl bg-luxury-gold/5 border border-luxury-gold/10 flex items-center justify-center text-luxury-gold hover:bg-luxury-gold/10 transition-all shadow-sm">
                    <Plus size={22} />
                  </button>
                </div>
                <AnimatePresence>
                  {aliases.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap gap-3 mt-4"
                    >
                      {aliases.map((a) => (
                        <motion.span
                          layout
                          key={a}
                          className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-luxury-cream border border-luxury-border font-black uppercase tracking-widest text-[10px] text-luxury-text-primary shadow-sm group/tag"
                        >
                          {a}
                          <button onClick={() => setAliases(aliases.filter(x => x !== a))} className="text-luxury-text-muted hover:text-status-danger transition-colors">
                            <X size={12} />
                          </button>
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[11px] font-black text-status-danger bg-status-danger/5 border border-status-danger/10 rounded-2xl px-6 py-4 uppercase tracking-widest"
              >
                {error}
              </motion.p>
            )}

            <div className="flex gap-6 pt-6 relative z-10">
              <button onClick={onClose} className="btn-secondary h-16 flex-1 text-[11px] font-black uppercase tracking-[0.2em] shadow-sm">Cancel Audit</button>
              <button onClick={submit} disabled={busy} className="btn-primary h-16 flex-1 text-[11px] font-black uppercase tracking-[0.2em] shadow-gold-lg">
                {busy ? <Loader2 size={22} className="animate-spin" /> : <><Check size={22} className="mr-3" /> Commit to Catalog</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

export function IngredientsPage({ onAdd }) {
  const { inventory, loading, refreshDashboard } = useDashboard();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleDelete = async (name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the master catalog? This action cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteIngredient(name);
      refreshDashboard({ silent: true });
    } catch (err) {
      console.error('Failed to delete ingredient:', err);
      alert(err?.response?.data?.detail || 'Failed to delete ingredient');
    } finally {
      setBusy(false);
    }
  };

  const filtered = inventory.filter((item) => {
    const matchSearch = item.ingredient.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || item.category === category;
    return matchSearch && matchCategory;
  });

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'all' ? inventory.length : inventory.filter(i => i.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="space-y-16 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 rounded-[32px] bg-white border border-luxury-border flex items-center justify-center text-luxury-gold shadow-premium">
            <Layers size={40} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.3em]">Module: Assets</span>
              <div className="h-px w-8 bg-luxury-gold/30" />
            </div>
            <h1 className="text-5xl font-black text-luxury-text-primary tracking-tight">Master Catalog</h1>
            <p className="text-luxury-text-muted text-sm font-medium italic">
              Centralized registry of {inventory.length} high-velocity kitchen assets across{' '}
              {new Set(inventory.map(i => i.category)).size} classifications.
            </p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary h-16 px-10 shadow-gold-lg gap-4">
          <Plus size={24} />
          <span className="font-black uppercase tracking-widest text-[11px]">Expand Inventory Catalog</span>
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-10">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-center">
          <div className="relative group w-full xl:w-[450px]">
            <Search size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-luxury-text-muted/30 group-focus-within:text-luxury-gold transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter master registry..."
              className="input-premium pl-16 h-16 text-base font-bold placeholder:text-luxury-text-muted/20 bg-white/60 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            {CATEGORIES.filter(c => categoryCounts[c] > 0 || c === 'all').map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-sm
                  ${category === cat
                    ? 'bg-luxury-gold text-white shadow-gold'
                    : 'bg-white border border-luxury-border text-luxury-text-muted hover:text-luxury-text-primary hover:bg-luxury-gold/5'
                  }`}
              >
                {cat} <span className="opacity-40 ml-2 font-black">[{categoryCounts[cat]}]</span>
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Table */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 w-full rounded-[28px] bg-white border border-luxury-border animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Layers} title="Operational Catalog Void" message="We could not locate any registered assets matching your filtration stream. Adjust parameters to resume audit." theme="warm" />
        ) : (
          <div className="data-table-container border-luxury-gold/5 shadow-premium">
            <table className="w-full">
              <thead>
                <tr className="data-table-header">
                  <th className="px-10 py-6 text-left font-black">Asset Profile</th>
                  <th className="px-10 py-6 text-left font-black">Classification</th>
                  <th className="px-10 py-6 text-right font-black">Aggregate Stock</th>
                  <th className="px-10 py-6 text-right font-black">Critical Floor</th>
                  <th className="px-10 py-6 text-left font-black">Shift Performance</th>
                  <th className="px-10 py-6 text-right font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luxury-border/30">
                {filtered.map((item, i) => {
                  const pct = item.reorder_threshold > 0
                    ? Math.min(100, (item.current_stock / item.reorder_threshold) * 100)
                    : 100;
                  const isLow = item.current_stock <= item.reorder_threshold;
                  return (
                    <motion.tr
                      key={item.ingredient}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.6), duration: 0.6 }}
                      className="data-table-row group"
                    >
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-2">
                          <span className="text-lg font-black text-luxury-text-primary capitalize group-hover:text-luxury-gold transition-colors tracking-tight">{item.ingredient}</span>
                          <div className="flex items-center gap-3">
                            <Fingerprint size={12} className="text-luxury-gold" />
                            <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">S-IQ: {item.ingredient.slice(0, 3).toUpperCase()}-{i + 100}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="badge-gold uppercase tracking-[0.2em] font-black text-[10px] px-4 py-2 shadow-sm italic">{item.category}</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-baseline justify-end gap-2 font-mono">
                          <span className={`text-2xl font-black tabular-nums ${isLow ? 'text-status-danger' : 'text-luxury-text-primary'}`}>
                            {item.current_stock.toFixed(1)}
                          </span>
                          <span className="text-[11px] font-black text-luxury-text-muted uppercase tracking-widest">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-baseline justify-end gap-2 font-mono text-luxury-text-muted/40">
                          <span className="font-black text-base">{item.reorder_threshold}</span>
                          <span className="uppercase text-[10px] tracking-widest">{item.unit}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                          <div className="flex-1 w-32 h-2.5 rounded-full bg-luxury-cream overflow-hidden border border-luxury-border shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1.8, delay: 0.4 }}
                              className={`h-full rounded-full shadow-sm ${isLow ? 'bg-status-danger shadow-sm' : pct < 80 ? 'bg-status-warning' : 'bg-status-success shadow-sm'
                                }`}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isLow ? 'bg-status-danger animate-pulse' : 'bg-status-success'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isLow ? 'text-status-danger' : 'text-status-success'}`}>
                              {isLow ? 'Refill Priority' : 'Operational'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleDelete(item.ingredient)}
                            disabled={busy}
                            className="w-10 h-10 rounded-xl bg-status-danger/5 border border-status-danger/10 flex items-center justify-center text-status-danger hover:bg-status-danger/10 transition-all shadow-sm"
                            title="Remove from Catalog"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddIngredientModal show={showModal} onClose={() => setShowModal(false)} onAdd={onAdd} />
    </div>
  );
}
