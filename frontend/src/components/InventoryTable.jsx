import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, Edit2, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';

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
      <td colSpan={7} className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Add stock for <span className="text-slate-200 capitalize">{item.ingredient}</span>:</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={`Qty in ${item.unit}`}
            autoFocus
            className="input-field w-36 py-1.5 text-sm"
          />
          <button onClick={submit} disabled={busy || !qty} className="btn-primary py-1.5 px-3 text-xs gap-1.5">
            <Plus size={12} /> Add Stock
          </button>
          <button onClick={onClose} className="btn-secondary py-1.5 px-2.5 text-xs">
            <X size={12} />
          </button>
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
      className="bg-surface-700/30"
    >
      <td colSpan={7} className="px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-400">Set absolute stock:</span>
          <input
            type="number" min="0" step="0.01"
            value={val} onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="input-field w-32 py-1.5 text-sm"
            autoFocus
          />
          <span className="text-xs text-slate-400">Reorder threshold:</span>
          <input
            type="number" min="0" step="0.1"
            value={thr} onChange={(e) => setThr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            className="input-field w-32 py-1.5 text-sm"
          />
          <button onClick={submit} disabled={busy} className="btn-primary py-1.5 px-3 text-xs gap-1.5">
            <Check size={12} /> Save
          </button>
          <button onClick={onClose} className="btn-secondary py-1.5 px-2.5 text-xs">
            <X size={12} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

export function InventoryTable({ items, onUpdate, onRestock }) {
  const [activeRow,   setActiveRow]   = useState(null); // { name, mode: 'restock'|'edit' }
  const [sortKey,     setSortKey]     = useState('ingredient');
  const [sortDir,     setSortDir]     = useState('asc');
  const [filterAlert, setFilterAlert] = useState(false);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return null;
    return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  const sorted = [...items]
    .filter((i) => !filterAlert || i.alert)
    .sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const alertCount = items.filter((i) => i.alert).length;

  const openRow = (name, mode) =>
    setActiveRow((prev) => (prev?.name === name && prev?.mode === mode ? null : { name, mode }));

  return (
    <div className="glass-card overflow-hidden">
      {/* Filter bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <p className="text-xs text-slate-500">{sorted.length} of {items.length} items</p>
        <button
          onClick={() => setFilterAlert((f) => !f)}
          className={`flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 font-medium transition-all
            ${filterAlert
              ? 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
              : 'border border-white/10 text-slate-400 hover:text-slate-200'}`}
        >
          <AlertTriangle size={11} />
          Alerts only {alertCount > 0 && `(${alertCount})`}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-white/[0.06]">
            <tr className="text-xs uppercase tracking-widest text-slate-500">
              {[
                { key: 'ingredient',        label: 'Ingredient' },
                { key: 'category',          label: 'Category' },
                { key: 'current_stock',     label: 'Stock' },
                { key: 'reorder_threshold', label: 'Threshold' },
                { key: null,                label: 'Level' },
                { key: null,                label: 'Status' },
                { key: null,                label: 'Actions' },
              ].map(({ key, label }, i) => (
                <th
                  key={i}
                  onClick={() => key && toggleSort(key)}
                  className={`px-4 py-3 text-left font-medium select-none
                    ${key ? 'cursor-pointer hover:text-slate-300' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {key && <SortIcon k={key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <AnimatePresence>
              {sorted.map((item, i) => {
                const pct = item.reorder_threshold > 0
                  ? Math.min(100, (item.current_stock / item.reorder_threshold) * 100)
                  : 100;
                const isLow    = item.current_stock <= item.reorder_threshold;
                const isActive = activeRow?.name === item.ingredient;

                return (
                  <>
                    <motion.tr
                      key={item.ingredient}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.015, 0.25) }}
                      className={`border-b border-white/[0.04] transition-colors
                        ${isActive ? 'bg-surface-700/40' : 'hover:bg-surface-700/20'}
                        ${isLow ? 'bg-accent-rose/[0.03]' : ''}`}
                    >
                      {/* Ingredient */}
                      <td className="px-4 py-3 font-medium text-slate-200 capitalize">
                        {item.ingredient}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="badge badge-brand capitalize">{item.category}</span>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {item.current_stock.toFixed(2)}
                        <span className="text-slate-500 text-xs ml-1">{item.unit}</span>
                      </td>

                      {/* Threshold */}
                      <td className="px-4 py-3 font-mono text-slate-500 text-xs">
                        {item.reorder_threshold} {item.unit}
                      </td>

                      {/* Level bar */}
                      <td className="px-4 py-3">
                        <div className="w-20 h-1.5 rounded-full bg-surface-600 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              isLow ? 'bg-accent-rose' : pct < 60 ? 'bg-accent-amber' : 'bg-accent-emerald'
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{Math.round(pct)}%</p>
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        {item.alert ? (
                          <span className="badge badge-amber flex items-center gap-1">
                            <AlertTriangle size={10} /> Low
                          </span>
                        ) : (
                          <span className="badge badge-green">OK</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openRow(item.ingredient, 'restock')}
                            title="Restock"
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all border
                              ${isActive && activeRow?.mode === 'restock'
                                ? 'bg-brand-600/30 text-brand-400 border-brand-500/30'
                                : 'border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'}`}
                          >
                            <Plus size={12} className="inline mr-0.5" /> Restock
                          </button>
                          <button
                            onClick={() => openRow(item.ingredient, 'edit')}
                            title="Edit"
                            className={`rounded-lg p-1.5 transition-all border
                              ${isActive && activeRow?.mode === 'edit'
                                ? 'bg-surface-600/60 text-slate-200 border-white/20'
                                : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'}`}
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>

                    {/* Inline restock / edit row */}
                    <AnimatePresence>
                      {isActive && activeRow?.mode === 'restock' && (
                        <RestockRow
                          key={`restock-${item.ingredient}`}
                          item={item}
                          onRestock={onRestock}
                          onClose={() => setActiveRow(null)}
                        />
                      )}
                      {isActive && activeRow?.mode === 'edit' && (
                        <EditRow
                          key={`edit-${item.ingredient}`}
                          item={item}
                          onUpdate={onUpdate}
                          onClose={() => setActiveRow(null)}
                        />
                      )}
                    </AnimatePresence>
                  </>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
