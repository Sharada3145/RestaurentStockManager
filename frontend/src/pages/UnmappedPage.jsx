import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ScanSearch, Loader2, Target, Brain, Fingerprint, Clock, Check, X, Quote, Zap, Sparkles } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { useDashboard } from '../context/DashboardContext';

export function UnmappedPage({ onMap }) {
  const { unmapped, loading } = useDashboard();
  const [mappingId, setMappingId] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [busy, setBusy] = useState(false);

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
    <div className="mx-auto max-w-[1400px] space-y-16 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 rounded-[32px] bg-white border border-luxury-border flex items-center justify-center text-luxury-gold shadow-premium">
            <Brain size={40} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.3em]">Module: Intelligence</span>
              <div className="h-px w-8 bg-luxury-gold/30" />
            </div>
            <h1 className="text-5xl font-black text-luxury-text-primary tracking-tight">Review Queue</h1>
            <p className="text-luxury-text-muted text-sm font-medium italic">
              Manual reconciliation of unrecognized kitchen entries. Each verification retrains the neural mapping model.
            </p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-6 px-8 py-5 rounded-3xl bg-white/60 border border-luxury-border shadow-premium">
          <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 flex items-center justify-center text-luxury-gold shadow-sm">
            <Zap size={22} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-luxury-text-primary uppercase tracking-[0.2em] leading-none">
              Queue Active
            </p>
            <p className="text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest">
              {unmapped.length} Items Pending
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-24 flex flex-col items-center justify-center gap-10 border-luxury-gold/5 bg-white/70">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-luxury-gold/10 border-t-luxury-gold animate-spin shadow-gold" />
          </div>
          <p className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.4em] animate-pulse">Syncing Cognitive Stream...</p>
        </div>
      ) : unmapped.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Neural Queue Verified"
          message="All operational kitchen entries have been successfully reconciled. Coverage: 100%."
          theme="warm"
        />
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <AnimatePresence>
            {unmapped.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ delay: i * 0.05, duration: 0.6 }}
                className={`glass-panel p-10 relative overflow-hidden group border-l-8 transition-all hover:bg-white/80 ${mappingId === entry.id ? 'border-l-luxury-gold bg-luxury-gold/[0.02]' : 'border-l-status-danger bg-white/60'
                  } shadow-premium`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity rotate-12">
                  <Quote size={120} className="text-luxury-text-primary" />
                </div>

                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 relative z-10">
                  <div className="space-y-6 flex-1 min-w-0">
                    <div className="flex items-center gap-5">
                      <div className="w-2.5 h-2.5 rounded-full bg-status-danger shadow-[0_0_8px_rgba(239,68,68,0.5)] shrink-0" />
                      <p className="text-2xl font-black text-luxury-text-primary italic tracking-tight truncate leading-relaxed">"{entry.raw_text}"</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-luxury-gold/10 flex items-center justify-center text-luxury-gold shadow-sm">
                          <Fingerprint size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-widest opacity-60">Reporting Operator</span>
                          <span className="text-[12px] font-black text-luxury-text-primary uppercase tracking-widest">{entry.chef_name}</span>
                        </div>
                      </div>

                      {entry.quantity != null && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-luxury-terracotta/10 flex items-center justify-center text-luxury-terracotta shadow-sm">
                            <Target size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-widest opacity-60">Extracted Metrics</span>
                            <span className="text-[12px] font-black text-luxury-text-primary uppercase tracking-widest">{entry.quantity} {entry.unit}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-luxury-text-primary/10 flex items-center justify-center text-luxury-text-primary shadow-sm">
                          <Clock size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-widest opacity-60">Timestamp</span>
                          <span className="text-[12px] font-black text-luxury-text-primary uppercase tracking-widest tabular-nums">{new Date(entry.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {entry.attempted_label && (
                        <div className="flex items-center gap-3 px-5 py-2.5 rounded-[18px] bg-status-warning/10 border border-status-warning/20 shadow-sm">
                          <Sparkles size={14} className="text-status-warning" />
                          <span className="text-[10px] font-black text-status-warning uppercase tracking-[0.2em]">Neural Guess: {entry.attempted_label}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {mappingId !== entry.id && (
                    <button
                      onClick={() => { setMappingId(entry.id); setInputVal(entry.attempted_label || ''); }}
                      className="btn-primary h-16 px-10 text-[11px] uppercase tracking-[0.2em] font-black shadow-gold-lg shrink-0 self-start xl:self-center"
                    >
                      Audit & Reconcile
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {mappingId === entry.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden relative z-10"
                    >
                      <div className="mt-12 pt-10 border-t border-luxury-border/30">
                        <div className="flex flex-col lg:flex-row gap-8 items-end lg:items-center">
                          <div className="flex-1 w-full space-y-3">
                            <label className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.3em] ml-1 flex items-center gap-3">
                              <Target size={14} /> Correct Canonical Identity
                            </label>
                            <input
                              value={inputVal}
                              onChange={(e) => setInputVal(e.target.value)}
                              placeholder="Ex: Chicken Breast, Whole Milk..."
                              className="input-premium h-16 text-lg font-black shadow-sm"
                              onKeyDown={(e) => e.key === 'Enter' && submit(entry.id)}
                              autoFocus
                            />
                          </div>
                          <div className="flex items-center gap-5">
                            <button
                              onClick={() => submit(entry.id)}
                              disabled={busy}
                              className="btn-primary h-16 px-12 text-[12px] uppercase tracking-[0.3em] font-black shadow-gold-lg"
                            >
                              {busy ? <Loader2 size={24} className="animate-spin" /> : <><Check size={24} className="mr-3" /> Commit & Retrain</>}
                            </button>
                            <button
                              onClick={() => setMappingId(null)}
                              className="w-16 h-16 rounded-2xl bg-white border border-luxury-border flex items-center justify-center text-luxury-text-muted hover:text-status-danger transition-all shadow-sm"
                            >
                              <X size={24} />
                            </button>
                          </div>
                        </div>
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
