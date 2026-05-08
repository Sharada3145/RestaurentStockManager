import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Layers, Tag, X, ChevronDown, Loader2, Check } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { EmptyState }   from '../components/EmptyState';

const CATEGORIES = ['all','grain','protein','vegetable','dairy','spice','oil','legume','fruit','sauce','dry','general'];
const UNITS      = ['kg','liters','count','g','ml'];

function AddIngredientModal({ onClose, onAdd }) {
  const [name,      setName]      = useState('');
  const [category,  setCategory]  = useState('general');
  const [unit,      setUnit]      = useState('kg');
  const [threshold, setThreshold] = useState('1.0');
  const [aliasInput,setAliasInput]= useState('');
  const [aliases,   setAliases]   = useState([]);
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState('');

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="glass-card w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Ingredient</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">Ingredient Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. basmati rice" className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
              {CATEGORIES.filter(c => c !== 'all').map(c => (
                <option key={c} value={c} className="bg-surface-800">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Default Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="input-field">
              {UNITS.map(u => <option key={u} value={u} className="bg-surface-800">{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">Reorder Threshold</label>
          <input type="number" min="0" step="0.1" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="input-field" />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">Aliases (press Enter to add)</label>
          <div className="flex gap-2">
            <input
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAlias())}
              placeholder="e.g. jeera, cumin seeds"
              className="input-field flex-1 py-2"
            />
            <button onClick={addAlias} className="btn-secondary px-3 py-2"><Plus size={14} /></button>
          </div>
          {aliases.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {aliases.map((a) => (
                <span key={a} className="badge badge-brand gap-1.5">
                  {a}
                  <button onClick={() => setAliases(aliases.filter(x => x !== a))} className="hover:text-rose-400 transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs text-accent-rose bg-accent-rose/10 border border-accent-rose/20 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={submit} disabled={busy} className="btn-primary flex-1 justify-center">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {busy ? 'Adding…' : 'Add Ingredient'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function IngredientsPage({ onAdd }) {
  const { inventory, loading } = useDashboard();
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('all');
  const [showModal,  setShowModal]  = useState(false);

  const filtered = inventory.filter((item) => {
    const matchSearch   = item.ingredient.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || item.category === category;
    return matchSearch && matchCategory;
  });

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'all' ? inventory.length : inventory.filter(i => i.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ingredients</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {inventory.length} ingredients tracked across{' '}
            {new Set(inventory.map(i => i.category)).size} categories.
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary gap-2">
          <Plus size={14} /> Add Ingredient
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredients…"
            className="input-field pl-9 py-2.5"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter(c => categoryCounts[c] > 0 || c === 'all').map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all duration-150
                ${category === cat
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                  : 'border border-white/10 bg-surface-700/40 text-slate-400 hover:text-slate-200 hover:border-white/20'
                }`}
            >
              {cat} {categoryCounts[cat] > 0 && <span className="opacity-60 ml-0.5">({categoryCounts[cat]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card p-6 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton h-10 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Layers} title="No ingredients found" message="Try a different search or category filter." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.06]">
                <tr className="text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3 text-left font-medium">Ingredient</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-right font-medium">Stock</th>
                  <th className="px-4 py-3 text-right font-medium">Threshold</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const pct = item.reorder_threshold > 0
                    ? Math.min(100, (item.current_stock / item.reorder_threshold) * 100)
                    : 100;
                  const isLow = item.current_stock <= item.reorder_threshold;
                  return (
                    <motion.tr
                      key={item.ingredient}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className="border-b border-white/[0.04] hover:bg-surface-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-200 capitalize">{item.ingredient}</td>
                      <td className="px-4 py-3">
                        <span className="badge badge-brand capitalize">{item.category}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {item.current_stock.toFixed(2)} <span className="text-slate-500 text-xs">{item.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-500 text-xs">
                        {item.reorder_threshold} {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-surface-600 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isLow ? 'bg-accent-rose' : pct < 80 ? 'bg-accent-amber' : 'bg-accent-emerald'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${isLow ? 'text-accent-rose' : 'text-accent-emerald'}`}>
                            {isLow ? 'Low' : 'OK'}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showModal && (
          <AddIngredientModal onClose={() => setShowModal(false)} onAdd={onAdd} />
        )}
      </AnimatePresence>
    </div>
  );
}
