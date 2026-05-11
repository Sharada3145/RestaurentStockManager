import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Check, Edit2, Plus, X,
  ChevronUp, ChevronDown, Search, Filter, ArrowRight,
  TrendingDown, ShoppingBag, Settings2, PackageCheck
} from 'lucide-react';

function RestockRow({ item, onRestock, onClose }) {
  const [qty, setQty] = useState('');
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
      className="bg-luxury-gold/[0.03]"
    >
      <td colSpan={7} className="px-10 py-8">
        <div className="flex items-center gap-10">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-luxury-gold uppercase tracking-[0.2em]">Inventory Intake</span>
            <span className="text-base text-luxury-text-primary font-bold">Registering purchase for <span className="text-luxury-gold capitalize">{item.ingredient}</span></span>
          </div>
          <div className="flex items-center gap-6 ml-auto">
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
                className="input-premium w-48 h-14 pr-16 text-lg font-bold"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-luxury-text-muted uppercase tracking-widest">{item.unit}</span>
            </div>
            <button onClick={submit} disabled={busy || !qty} className="btn-primary h-14 px-8 text-xs uppercase tracking-[0.2em] font-black shadow-gold">
              {busy ? 'Processing...' : 'Confirm Delivery'}
            </button>
            <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-luxury-cream border border-luxury-border flex items-center justify-center text-luxury-text-muted hover:text-luxury-text-primary transition-all">
              <X size={20} />
            </button>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

function EditRow({ item, onUpdate, onClose }) {
  const [val, setVal] = useState(String(item.current_stock));
  const [thr, setThr] = useState(String(item.reorder_threshold));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onUpdate({
        ingredient_name: item.ingredient,
        set_absolute: parseFloat(val),
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
      className="bg-luxury-cream/50"
    >
      <td colSpan={7} className="px-10 py-10">
        <div className="flex items-center gap-12">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">Operational Audit</span>
            <span className="text-base text-luxury-text-primary font-bold">Adjusting master record for <span className="text-luxury-text-primary underline decoration-luxury-gold/30 capitalize">{item.ingredient}</span></span>
          </div>

          <div className="flex items-center gap-8 ml-auto">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-luxury-gold uppercase tracking-widest ml-1">Current Stock</label>
              <input
                type="number" min="0" step="0.01"
                value={val} onChange={(e) => setVal(e.target.value)}
                className="input-premium w-36 h-12 text-sm font-bold shadow-sm"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-luxury-text-muted uppercase tracking-widest ml-1">Reorder Alert</label>
              <input
                type="number" min="0" step="0.1"
                value={thr} onChange={(e) => setThr(e.target.value)}
                className="input-premium w-36 h-12 text-sm font-bold shadow-sm"
              />
            </div>
            <div className="flex items-center gap-4 mt-8">
              <button onClick={submit} disabled={busy} className="btn-secondary h-12 px-8 text-[10px] uppercase tracking-[0.2em] font-black">
                {busy ? 'Updating...' : 'Commit Audit'}
              </button>
              <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white border border-luxury-border flex items-center justify-center text-luxury-text-muted hover:text-luxury-text-primary transition-all">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      </td>
    </motion.tr>
  );
}

export function InventoryTable({ items = [], onUpdate, onRestock, theme = 'warm' }) {
  const [activeRow, setActiveRow] = useState(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('ingredient');
  const [sortDir, setSortDir] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('ALL');

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
    <div className="space-y-10">
      {/* Table Filters */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8">
        <div className="relative w-full xl:w-[450px] group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-luxury-text-muted/30 group-focus-within:text-luxury-gold transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search operational inventory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-premium pl-14 h-14 text-sm font-medium shadow-sm bg-white/50"
          />
        </div>

        <div className="flex items-center gap-4 p-2 rounded-3xl bg-white/60 border border-luxury-border shadow-premium">
          {['ALL', 'CRITICAL', 'WARNING'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-8 py-3 text-[11px] font-black rounded-2xl transition-all uppercase tracking-[0.2em] ${filterStatus === status
                  ? 'bg-luxury-gold text-white shadow-gold'
                  : 'text-luxury-text-muted hover:text-luxury-text-primary hover:bg-luxury-gold/5'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="data-table-container border-luxury-gold/5">
        <table className="w-full">
          <thead>
            <tr className="data-table-header">
              <th className="px-10 py-6 cursor-pointer group" onClick={() => toggleSort('ingredient')}>
                <div className="flex items-center gap-3 group-hover:text-luxury-gold transition-colors">
                  Ingredient Identity
                  <div className="flex flex-col opacity-20 group-hover:opacity-100 transition-opacity">
                    <ChevronUp size={12} className={sortKey === 'ingredient' && sortDir === 'asc' ? 'text-luxury-gold opacity-100' : ''} />
                    <ChevronDown size={12} className={sortKey === 'ingredient' && sortDir === 'desc' ? 'text-luxury-gold opacity-100' : ''} />
                  </div>
                </div>
              </th>
              <th className="px-10 py-6">Opening Vol</th>
              <th className="px-10 py-6">Shift Usage</th>
              <th className="px-10 py-6">Available Stock</th>
              <th className="px-10 py-6">Performance</th>
              <th className="px-10 py-6 text-right font-black">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-luxury-border/30">
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
                      className={`data-table-row group transition-colors ${isActive ? 'bg-luxury-gold/[0.02]' : ''} ${i % 2 !== 0 ? 'data-table-row-alt' : ''}`}
                    >
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-black text-luxury-text-primary capitalize text-lg tracking-tight group-hover:text-luxury-gold transition-colors">{item.ingredient}</span>
                          <span className="text-[10px] text-luxury-text-muted font-bold uppercase tracking-[0.2em]">{item.category}</span>
                        </div>
                      </td>

                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-luxury-text-primary/70 text-base tabular-nums">{item.opening_stock.toFixed(1)}</span>
                          <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-widest">{item.unit}</span>
                        </div>
                      </td>

                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3 text-luxury-terracotta font-black bg-luxury-terracotta/[0.05] border border-luxury-terracotta/10 rounded-2xl px-4 py-2 w-fit shadow-sm">
                          <TrendingDown size={16} />
                          <span className="font-mono text-base">-{item.used_today.toFixed(1)}</span>
                          <span className="text-[10px] uppercase tracking-widest opacity-60">{item.unit}</span>
                        </div>
                      </td>

                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-black tabular-nums tracking-tighter ${item.status === 'CRITICAL' ? 'text-status-danger' : item.status === 'WARNING' ? 'text-status-warning' : 'text-luxury-text-primary'
                              }`}>
                              {item.current_stock.toFixed(1)}
                            </span>
                            <span className="text-[11px] font-black text-luxury-text-muted uppercase tracking-widest">{item.unit}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-10 py-8">
                        <div className="w-40 space-y-3">
                          <div className="flex justify-between items-end">
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${item.status === 'CRITICAL' ? 'text-status-danger' : item.status === 'WARNING' ? 'text-status-warning' : 'text-status-success'
                              }`}>
                              {item.status}
                            </span>
                            <span className="text-[10px] font-black text-luxury-text-muted tracking-widest">{Math.round(pct)}%</span>
                          </div>
                          <div className="h-2 w-full bg-luxury-cream rounded-full overflow-hidden border border-luxury-border shadow-inner">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full rounded-full ${item.status === 'CRITICAL' ? 'bg-status-danger shadow-sm' : item.status === 'WARNING' ? 'bg-status-warning' : 'bg-status-success shadow-sm'
                                }`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <button
                            onClick={() => openRow(item.ingredient, 'restock')}
                            className={`w-12 h-12 rounded-[18px] border-2 flex items-center justify-center transition-all shadow-sm ${isActive && activeRow?.mode === 'restock'
                                ? 'bg-luxury-gold border-luxury-gold text-white shadow-gold'
                                : 'border-luxury-border text-luxury-text-muted hover:border-luxury-gold/50 hover:text-luxury-gold hover:bg-white'
                              }`}
                            title="Register Purchase"
                          >
                            <ShoppingBag size={20} />
                          </button>
                          <button
                            onClick={() => openRow(item.ingredient, 'edit')}
                            className={`w-12 h-12 rounded-[18px] border-2 flex items-center justify-center transition-all shadow-sm ${isActive && activeRow?.mode === 'edit'
                                ? 'bg-luxury-text-primary border-luxury-text-primary text-white shadow-lg'
                                : 'border-luxury-border text-luxury-text-muted hover:border-luxury-text-primary/30 hover:text-luxury-text-primary hover:bg-white'
                              }`}
                            title="Audit Record"
                          >
                            <Settings2 size={20} />
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
          <div className="py-32 flex flex-col items-center justify-center gap-10 text-luxury-text-muted/20">
            <div className="w-24 h-24 rounded-[40px] bg-luxury-cream border border-luxury-border flex items-center justify-center shadow-premium">
              <PackageCheck size={48} className="text-luxury-text-muted/30" />
            </div>
            <div className="text-center space-y-3">
              <p className="text-xl font-black text-luxury-text-primary uppercase tracking-tight">No Catalog Matches</p>
              <p className="text-sm font-medium max-w-sm mx-auto text-luxury-text-secondary">We couldn't find any ingredients matching your current filtration criteria.</p>
            </div>
            <button onClick={() => { setSearch(''); setFilterStatus('ALL'); }} className="btn-secondary h-14 px-10 text-[11px] uppercase tracking-[0.2em] font-black border-dashed">
              Reset Operational Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
