import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, ChefHat, Loader2, SendHorizontal, XCircle, AlertCircle } from 'lucide-react';

const STATUS_BADGE = {
  mapped:   { cls: 'badge-green',  label: 'Mapped' },
  unmapped: { cls: 'badge-rose',   label: 'Unmapped' },
};

const METHOD_BADGE = {
  exact: 'badge-teal',
  fuzzy: 'badge-amber',
  ml:    'badge-violet',
  none:  'badge-rose',
};

export function StockEntryPage({ onSubmit, notify }) {
  const [rawText,     setRawText]     = useState('');
  const [chefName,    setChefName]    = useState('');
  const [managerName, setManagerName] = useState('');
  const [results,     setResults]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const examplePhrases = [
    '2kg rice and 500g chicken',
    '1/2 kg salt, 3 liters oil',
    '5 eggs, half kg butter',
    'two liters milk & 300g cheese',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rawText.trim() || !chefName.trim() || !managerName.trim()) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setLoading(true);
    setResults(null);
    try {
      const data = await onSubmit({ raw_text: rawText, chef_name: chefName, manager_name: managerName });
      setResults(data.results || []);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Stock Entry</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Describe what was used in natural language. Supports multiple items.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Kitchen Note</label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="e.g. 2kg rice and 500g chicken, 3 liters oil"
            rows={3}
            className="input-field resize-none"
          />
          {/* Example chips */}
          <div className="mt-2 flex flex-wrap gap-2">
            {examplePhrases.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setRawText(p)}
                className="rounded-full border border-white/10 bg-surface-700/40 px-2.5 py-0.5 text-[11px] text-slate-400 hover:border-brand-500/40 hover:text-brand-400 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Chef Name</label>
            <input
              value={chefName}
              onChange={(e) => setChefName(e.target.value)}
              placeholder="e.g. Marco"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Manager Name</label>
            <input
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="e.g. Sarah"
              className="input-field"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-accent-rose/10 border border-accent-rose/20 px-4 py-2.5 text-sm text-accent-rose">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Processing…</>
            : <><SendHorizontal size={15} /> Submit Entry</>}
        </button>
      </form>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Parsed Results — {results.length} item{results.length !== 1 ? 's' : ''}
            </h3>
            {results.map((r, i) => {
              const statusInfo = STATUS_BADGE[r.status] || STATUS_BADGE.unmapped;
              const methodCls  = METHOD_BADGE[r.mapping_method] || 'badge-rose';
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className={`glass-card p-4 flex items-start gap-4 ${r.status === 'unmapped' ? 'border-accent-rose/20' : 'border-accent-emerald/10'}`}
                >
                  <div className="mt-0.5">
                    {r.status === 'mapped'
                      ? <CheckCircle size={18} className="text-accent-emerald" />
                      : <XCircle    size={18} className="text-accent-rose" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-200 capitalize">{r.ingredient}</span>
                      <span className={`badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                      <span className={`badge ${methodCls}`}>{r.mapping_method}</span>
                      {r.needs_review && <span className="badge badge-amber">Needs Review</span>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 font-mono">{r.cleaned_text}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                      {r.quantity != null && (
                        <span><span className="text-slate-500">Qty:</span> {r.quantity.toFixed(3)} {r.unit}</span>
                      )}
                      <span><span className="text-slate-500">Confidence:</span> {r.confidence.toFixed(1)}%</span>
                    </div>
                    {/* Confidence bar */}
                    <div className="mt-2 h-1 w-full rounded-full bg-surface-600 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${r.confidence}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${r.confidence >= 90 ? 'bg-accent-emerald' : r.confidence >= 70 ? 'bg-accent-amber' : 'bg-accent-rose'}`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
