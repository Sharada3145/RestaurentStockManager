import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ScanSearch, Loader2 } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { useDashboard } from '../context/DashboardContext';

export function UnmappedPage({ onMap }) {
  const { unmapped, loading } = useDashboard();
  const [mappingId, setMappingId]   = useState(null);
  const [inputVal,  setInputVal]    = useState('');
  const [busy,      setBusy]        = useState(false);

  const submit = async (id) => {
    if (!inputVal.trim()) return;
    setBusy(true);
    try {
      await onMap(id, inputVal.trim());
      setMappingId(null);
      setInputVal('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Review Queue</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Map unrecognised entries to ingredients. Each mapping retrains the ML model.
        </p>
      </div>

      {loading ? (
        <div className="glass-card p-6 text-center text-sm text-slate-500 animate-pulse">Loading unmapped entries…</div>
      ) : unmapped.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Queue is empty"
          message="All entries have been mapped. Great work!"
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {unmapped.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-slate-200 truncate">{entry.raw_text}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>Chef: <span className="text-slate-400">{entry.chef_name}</span></span>
                      {entry.quantity != null && (
                        <span>Qty: <span className="font-mono text-slate-400">{entry.quantity} {entry.unit}</span></span>
                      )}
                      {entry.attempted_label && (
                        <span>Guessed: <span className="text-accent-amber">{entry.attempted_label}</span></span>
                      )}
                      <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { setMappingId(entry.id); setInputVal(entry.attempted_label || ''); }}
                    className="btn-secondary text-xs py-1.5 shrink-0"
                  >
                    Map
                  </button>
                </div>

                <AnimatePresence>
                  {mappingId === entry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2 pt-1">
                        <input
                          value={inputVal}
                          onChange={(e) => setInputVal(e.target.value)}
                          placeholder="Canonical ingredient name (e.g. chicken)"
                          className="input-field flex-1 py-2 text-sm"
                          onKeyDown={(e) => e.key === 'Enter' && submit(entry.id)}
                          autoFocus
                        />
                        <button
                          onClick={() => submit(entry.id)}
                          disabled={busy}
                          className="btn-primary py-2 px-3"
                        >
                          {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        </button>
                        <button onClick={() => setMappingId(null)} className="btn-secondary py-2 px-3 text-xs">
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
