import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Check, Edit2, Plus, X, 
  ChevronUp, ChevronDown, Search, Filter, ArrowRight 
} from 'lucide-react';

function RestockRow({ item, onRestock, onClose }) {
  const [qty, setQty]   = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const amount = parseFloat(qty);
    if (!amount || amount <= 0) return;
    setBusy(true);
    try {
      await onRestock({ ingredient_name: item.ingredient, quantity: amount, unit: item.unit });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-brand-500/5"
    >
      <td colSpan={7} className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mb-1">Quick Restock</span>
            <span className="text-sm text-slate-200">Adding stock for <span className="font-bold capitalize">{item.ingredient}</span></span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder={`0.00`}
                autoFocus
                className="input-modern w-32 py-2 pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 uppercase">{item.unit}</span>
            </div>
            <button onClick={submit} disabled={busy || !qty} className="btn-primary py-2 px-4 text-xs">
              Confirm Purchase
            </button>
            <button onClick={onClose} className="btn-ghost p-2">
              <X size={16} />
            </button>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

function EditRow({ item, onUpdate, onClose }) {
  const [val,  setVal]  = useState(String(item.current_stock));
  const [thr,  setThr]  = useState(String(item.reorder_threshold));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onUpdate({
        ingredient_name:   item.ingredient,
        set_absolute:      parseFloat(val),
        reorder_threshold: parseFloat(thr),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-surface-800/50"
    >
      <td colSpan={7} className="px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Adjust Inventory</span>
            <span className="text-sm text-slate-200">Manually overriding <span className="font-bold capitalize">{item.ingredient}</span></span>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Current Level</label>
              <input
                type="number" min="0" step="0.01"
                value={val} onChange={(e) => setVal(e.target.value)}
                className="input-modern w-28 py-1.5"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Alert Threshold</label>
              <input
                type="number" min="0" step="0.1"
                value={thr} onChange={(e) => setThr(e.target.value)}
                className="input-modern w-28 py-1.5"
              />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button onClick={submit} disabled={busy} className="btn-primary py-2 px-4 text-xs">
                Apply Changes
              </button>
              <button onClick={onClose} className="btn-ghost p-2">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

export function InventoryTable({ items = [], onUpdate, onRestock }) {
  const [activeRow, setActiveRow] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('ingredient');
  const [sortDir, setSortDir] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, CRITICAL, WARNING

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = items.filter(item => {
    const matchesSearch = item.ingredient.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const openRow = (name, mode) =>
    setActiveRow((prev) => (prev?.name === name && prev?.mode === mode ? null : { name, mode }));

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-modern pl-10 py-2"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
              filterStatus === 'ALL' ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-slate-500 hover:text-slate-300'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilterStatus('CRITICAL')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
              filterStatus === 'CRITICAL' ? 'bg-accent-rose/10 border-accent-rose/30 text-accent-rose' : 'border-white/5 text-slate-500'
            }`}
          >
            Critical
          </button>
          <button 
            onClick={() => setFilterStatus('WARNING')}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
              filterStatus === 'WARNING' ? 'bg-accent-amber/10 border-accent-amber/30 text-accent-amber' : 'border-white/5 text-slate-500'
            }`}
          >
            Warning
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="px-6 py-4 cursor-pointer" onClick={() => toggleSort('ingredient')}>
                <div className="flex items-center gap-2">Ingredient {sortKey === 'ingredient' && (sortDir === 'asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}</div>
              </th>
              <th className="px-6 py-4">Opening</th>
              <th className="px-6 py-4">Used</th>
              <th className="px-6 py-4">Remaining</th>
              <th className="px-6 py-4">Level</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            <AnimatePresence mode="popLayout">
              {sorted.map((item, i) => {
                const isActive = activeRow?.name === item.ingredient;
                const pct = item.opening_stock > 0 
                  ? Math.max(0, Math.min(100, (item.current_stock / item.opening_stock) * 100))
                  : (item.current_stock > 0 ? 100 : 0);

                return (
                  <React.Fragment key={item.ingredient}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`table-row ${isActive ? 'bg-white/[0.03]' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-200 capitalize">{item.ingredient}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-tight">{item.category}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-slate-400">
                        {item.opening_stock.toFixed(1)} <span className="text-[10px]">{item.unit}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-accent-rose font-medium">
                          <ArrowRight size={12} className="rotate-45" />
                          <span className="font-mono">-{item.used_today.toFixed(1)}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className={`text-base font-bold ${
                              item.status === 'CRITICAL' ? 'text-accent-rose' : item.status === 'WARNING' ? 'text-accent-amber' : 'text-slate-200'
                            }`}>
                              {item.current_stock.toFixed(1)}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase">{item.unit}</span>
                          </div>
                          {item.status !== 'HEALTHY' && (
                            <span className={`text-[9px] font-bold uppercase tracking-tight ${
                              item.status === 'CRITICAL' ? 'text-accent-rose' : 'text-accent-amber'
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="w-24 space-y-1.5">
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              className={`h-full rounded-full ${
                                item.status === 'CRITICAL' ? 'bg-accent-rose' : item.status === 'WARNING' ? 'bg-accent-amber' : 'bg-accent-emerald'
                              }`}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] font-bold text-slate-600">
                            <span>{Math.round(pct)}%</span>
                            <span>{item.reorder_threshold}{item.unit} min</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openRow(item.ingredient, 'restock')}
                            className={`p-2 rounded-lg border transition-all ${
                              isActive && activeRow?.mode === 'restock' 
                                ? 'bg-brand-500/10 border-brand-500/30 text-brand-400' 
                                : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                            }`}
                          >
                            <Plus size={16} />
                          </button>
                          <button 
                            onClick={() => openRow(item.ingredient, 'edit')}
                            className={`p-2 rounded-lg border transition-all ${
                              isActive && activeRow?.mode === 'edit' 
                                ? 'bg-white/10 border-white/20 text-white' 
                                : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                            }`}
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>

                    {/* Expandable Action Rows */}
                    <AnimatePresence>
                      {isActive && activeRow?.mode === 'restock' && (
                        <RestockRow item={item} onRestock={onRestock} onClose={() => setActiveRow(null)} />
                      )}
                      {isActive && activeRow?.mode === 'edit' && (
                        <EditRow item={item} onUpdate={onUpdate} onClose={() => setActiveRow(null)} />
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        
        {sorted.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-500">
            <Filter size={40} className="opacity-20" />
            <p className="text-sm">No items match your current filters.</p>
            <button onClick={() => { setSearch(''); setFilterStatus('ALL'); }} className="text-brand-400 text-xs font-bold uppercase tracking-wider">
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
