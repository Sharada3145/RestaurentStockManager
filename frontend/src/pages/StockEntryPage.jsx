import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  CheckCircle2, ChefHat, Loader2, SendHorizontal, 
  XCircle, AlertCircle, Quote, Sparkles, User, Info 
} from 'lucide-react';

const STATUS_BADGE = {
  mapped:   { cls: 'badge-success',  label: 'Mapped' },
  unmapped: { cls: 'badge-danger',   label: 'Unmapped' },
};

const METHOD_BADGE = {
  exact: 'badge-info',
  fuzzy: 'badge-warning',
  ml:    'badge-info',
  none:  'badge-danger',
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
    if (!rawText.trim() || !chefName.trim()) {
      setError('Chef name and note are required.');
      return;
    }
    setError('');
    setLoading(true);
    setResults(null);
    try {
      const data = await onSubmit({ raw_text: rawText, chef_name: chefName, manager_name: managerName });
      setResults(data.results || []);
      if (notify) notify('Usage logged successfully', 'success');
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
          <ChefHat size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Kitchen Intake</h1>
          <p className="text-slate-500 text-sm mt-1">Record daily ingredient consumption using AI assisted NLP.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Quote size={80} className="text-white" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-brand-400" />
                  Operator Identity
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={chefName}
                  onChange={(e) => setChefName(e.target.value)}
                  placeholder="Chef Name (e.g. Marco)"
                  className="input-modern"
                />
                <input
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Manager / Supervisor (Optional)"
                  className="input-modern"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={14} className="text-accent-teal" />
                  Consumption Note
                </label>
                <span className="text-[10px] text-slate-600 font-medium">AI will extract quantities & units</span>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Describe what was used... e.g. 'Used 5kg of basmati rice and 2L of cooking oil for lunch service'"
                rows={4}
                className="input-modern resize-none py-4 leading-relaxed"
              />
              
              <div className="flex flex-wrap gap-2 pt-2">
                {examplePhrases.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setRawText(p)}
                    className="px-3 py-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-[10px] font-bold text-slate-500 hover:border-brand-500/40 hover:text-brand-400 transition-all uppercase tracking-tight"
                  >
                    "{p}"
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 px-4 py-3 text-sm text-accent-rose"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base gap-3">
              {loading ? (
                <><Loader2 size={20} className="animate-spin" /> Analyzing Consumption...</>
              ) : (
                <><SendHorizontal size={20} /> Process Kitchen Note</>
              )}
            </button>
          </form>

          <div className="glass-card p-6 bg-brand-500/[0.02] border-brand-500/10">
            <div className="flex gap-4">
              <div className="mt-1 text-brand-400">
                <Info size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">How it works</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Our Neural Engine parses your natural language input to automatically deduct ingredients from the inventory. 
                  It recognizes multiple items, handles unit conversions (e.g. grams to kg), and identifies which chef is 
                  consuming resources for better accountability.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2">
          <div className="sticky top-8 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2">
              Processing Status
            </h3>
            
            <AnimatePresence mode="wait">
              {!results && !loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-12 flex flex-col items-center justify-center text-center gap-4"
                >
                  <div className="h-16 w-16 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-slate-700">
                    <Sparkles size={32} />
                  </div>
                  <p className="text-sm text-slate-500">Submit a kitchen note to see the AI extraction results here.</p>
                </motion.div>
              )}

              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-12 flex flex-col items-center justify-center gap-6"
                >
                  <div className="relative">
                    <Loader2 size={48} className="text-brand-500 animate-spin" />
                    <Sparkles size={20} className="absolute top-0 right-0 text-accent-teal animate-pulse" />
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-bold text-white">Extracting Data...</p>
                    <p className="text-xs text-slate-500">Mapping ingredients to inventory models</p>
                  </div>
                </motion.div>
              )}

              {results && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {results.map((r, i) => {
                    const statusInfo = STATUS_BADGE[r.status] || STATUS_BADGE.unmapped;
                    const methodCls  = METHOD_BADGE[r.mapping_method] || 'badge-danger';
                    
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`glass-card p-5 relative overflow-hidden group border-l-4 ${
                          r.status === 'mapped' ? 'border-l-accent-emerald' : 'border-l-accent-rose'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="min-w-0">
                            <h4 className="text-base font-bold text-white capitalize truncate">{r.ingredient}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`badge ${statusInfo.cls} px-2 py-0.5`}>{statusInfo.label}</span>
                              <span className={`badge ${methodCls} px-2 py-0.5 capitalize`}>{r.mapping_method} engine</span>
                            </div>
                          </div>
                          <div className={`p-2 rounded-lg ${r.status === 'mapped' ? 'text-accent-emerald bg-accent-emerald/5' : 'text-accent-rose bg-accent-rose/5'}`}>
                            {r.status === 'mapped' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium italic truncate max-w-[150px]">"{r.cleaned_text}"</span>
                            <span className="font-mono font-bold text-slate-200">
                              {r.quantity != null ? `${r.quantity.toFixed(2)} ${r.unit}` : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-500 uppercase">Engine Confidence</span>
                              <span className={r.confidence > 80 ? 'text-accent-emerald' : 'text-accent-amber'}>{Math.round(r.confidence)}%</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${r.confidence}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className={`h-full rounded-full ${
                                  r.confidence > 80 ? 'bg-accent-emerald' : r.confidence > 60 ? 'bg-accent-amber' : 'bg-accent-rose'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  <button 
                    onClick={() => { setResults(null); setRawText(''); }}
                    className="btn-secondary w-full py-3 text-xs uppercase tracking-widest font-bold"
                  >
                    Ready for Next Note
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
