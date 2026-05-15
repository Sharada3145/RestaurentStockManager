import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  CheckCircle2, ChefHat, Loader2, SendHorizontal, 
  XCircle, AlertCircle, Quote, Sparkles, User, Info,
  ChevronRight, ArrowRight, Zap, Fingerprint, PenTool,
  Clock, Coffee
} from 'lucide-react';

const STATUS_BADGE = {
  mapped:   { cls: 'badge-success',  label: 'Verified' },
  unmapped: { cls: 'badge-danger',   label: 'Unrecognized' },
};

const METHOD_BADGE = {
  exact: 'badge-gold',
  fuzzy: 'badge-warning',
  ml:    'badge-gold',
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
    '5kg basmati rice used for lunch',
    'Deducted 2 liters of olive oil',
    '300g cheese and 1kg chicken',
    'half kg butter, 2 liters milk',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rawText.trim() || !chefName.trim()) {
      setError('Chef name and operational note are required.');
      return;
    }
    setError('');
    setLoading(true);
    setResults(null);
    try {
      const data = await onSubmit({ raw_text: rawText, chef_name: chefName, manager_name: managerName });
      setResults(data.results || []);
      if (notify) notify('Kitchen operations logged successfully', 'success');
    } catch (err) {
      let msg = 'Intake process failed';
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string') msg = detail;
      else if (Array.isArray(detail)) msg = detail.map(d => d.msg || d).join(', ');
      else if (err.message) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-16 pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 rounded-[32px] bg-luxury-gradient flex items-center justify-center shadow-gold-lg text-white">
            <ChefHat size={40} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <span className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.3em]">Module 01</span>
               <div className="h-px w-8 bg-luxury-gold/30" />
            </div>
            <h1 className="text-5xl font-black text-luxury-text-primary tracking-tight">Stock Intake</h1>
            <p className="text-luxury-text-muted text-sm font-medium">Cognitive Natural Language Intake System</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-6 px-8 py-5 rounded-3xl bg-white/60 border border-luxury-border shadow-premium">
           <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 flex items-center justify-center text-luxury-gold">
              <Zap size={22} className="animate-pulse" />
           </div>
           <div className="space-y-1">
              <p className="text-[10px] font-black text-luxury-text-primary uppercase tracking-[0.2em] leading-none">
                 NLP Engine
              </p>
              <p className="text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest">
                 Active & Calibrated
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Form Section */}
        <div className="xl:col-span-7 space-y-10">
          <form onSubmit={handleSubmit} className="glass-panel p-12 space-y-12 relative overflow-hidden group border-luxury-gold/5">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity rotate-12">
              <Quote size={180} className="text-luxury-gold" />
            </div>

            <div className="space-y-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 flex items-center justify-center text-luxury-gold shadow-sm">
                  <Fingerprint size={20} />
                </div>
                <h3 className="text-xs font-black text-luxury-text-primary uppercase tracking-[0.2em]">Authentication</h3>
              </div>
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-luxury-gold uppercase tracking-[0.2em] ml-1">Reporting Chef</label>
                   <input
                     value={chefName}
                     onChange={(e) => setChefName(e.target.value)}
                     placeholder="Chef Identity (e.g. Marco)"
                     className="input-premium h-16 shadow-sm"
                   />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em] ml-1">Operational Manager (Opt)</label>
                   <input
                     value={managerName}
                     onChange={(e) => setManagerName(e.target.value)}
                     placeholder="Reviewer"
                     className="input-premium h-16 shadow-sm opacity-60 focus:opacity-100"
                   />
                </div>
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-luxury-terracotta/10 flex items-center justify-center text-luxury-terracotta shadow-sm">
                    <PenTool size={20} />
                  </div>
                  <h3 className="text-xs font-black text-luxury-text-primary uppercase tracking-[0.2em]">Consumption Log</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-luxury-gold/5 border border-luxury-gold/10">
                   <Clock size={12} className="text-luxury-gold" />
                   <span className="text-[10px] font-black text-luxury-gold uppercase tracking-widest">Real-time Stream</span>
                </div>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Ex: 'Logged 10kg of flour and 5 liters of whole milk for breakfast service...'"
                rows={6}
                className="input-premium resize-none py-8 text-xl leading-relaxed placeholder:text-luxury-text-muted/20 font-medium shadow-sm bg-white/40"
              />
              
              <div className="space-y-4">
                <p className="text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em] ml-1">Intelligent Templates</p>
                <div className="flex flex-wrap gap-3">
                  {examplePhrases.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRawText(p)}
                      className="px-5 py-3 rounded-2xl border border-luxury-border bg-white/40 text-[11px] font-bold text-luxury-text-secondary hover:border-luxury-gold/40 hover:text-luxury-gold hover:bg-luxury-gold/5 transition-all uppercase tracking-tight shadow-sm"
                    >
                      "{p}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-5 rounded-[20px] bg-status-danger/10 border border-status-danger/20 px-8 py-5 text-sm font-black text-status-danger shadow-sm"
              >
                <AlertCircle size={22} />
                <span className="uppercase tracking-widest">{error}</span>
              </motion.div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full h-20 text-lg gap-6 group shadow-gold-lg">
              {loading ? (
                <><Loader2 size={28} className="animate-spin" /> <span className="font-black uppercase tracking-[0.2em]">Parsing Intelligence...</span></>
              ) : (
                <>
                  <SendHorizontal size={28} className="group-hover:translate-x-2 transition-transform" /> 
                  <span className="font-black uppercase tracking-[0.2em]">Commit to Ledger</span>
                </>
              )}
            </button>
          </form>

          <div className="glass-panel p-10 bg-luxury-gold/[0.02] border-luxury-gold/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-[0.05] pointer-events-none">
                <Coffee size={80} className="text-luxury-gold" />
             </div>
            <div className="flex gap-8 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white border border-luxury-gold/20 flex items-center justify-center text-luxury-gold shadow-sm shrink-0">
                <Info size={24} />
              </div>
              <div className="space-y-3">
                <h4 className="text-lg font-black text-luxury-text-primary tracking-tight">AI-Driven Reconciliation</h4>
                <p className="text-sm text-luxury-text-secondary leading-relaxed font-medium">
                  The StockIQ neural engine extracts structured data from conversational notes. 
                  It handles unit conversion (liters/gallons), categorizes ingredients, and initiates 
                  real-time inventory reconciliation across your entire supply chain.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Sidebar */}
        <div className="xl:col-span-5">
          <div className="sticky top-12 space-y-8">
            <div className="flex items-center justify-between px-4">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse" />
                  <h3 className="text-[11px] font-black text-luxury-text-primary uppercase tracking-[0.2em]">Extraction Stream</h3>
               </div>
              {results && <span className="badge-gold font-black px-4 py-1.5">{results.length} ENTRIES FOUND</span>}
            </div>
            
            <AnimatePresence mode="wait">
              {!results && !loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-panel p-20 flex flex-col items-center justify-center text-center gap-8 border-dashed border-luxury-border bg-white/20"
                >
                  <div className="w-24 h-24 rounded-[40px] bg-white border border-luxury-border flex items-center justify-center text-luxury-text-muted/20 shadow-premium">
                    <Sparkles size={48} />
                  </div>
                  <div className="space-y-3">
                    <p className="text-base font-black text-luxury-text-primary uppercase tracking-widest">Awaiting Submission</p>
                    <p className="text-sm text-luxury-text-muted font-medium max-w-[200px] mx-auto">Analyze kitchen notes to view extracted data points.</p>
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-panel p-20 flex flex-col items-center justify-center gap-10 border-luxury-gold/10"
                >
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-luxury-gold/10 flex items-center justify-center shadow-gold">
                       <Loader2 size={56} className="text-luxury-gold animate-spin" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Zap size={28} className="text-luxury-gold animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-4 text-center">
                    <p className="text-2xl font-black text-luxury-text-primary tracking-tight">Processing Note</p>
                    <div className="flex items-center justify-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-bounce" />
                       <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-bounce [animation-delay:0.2s]" />
                       <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}

              {results && (
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {results.map((r, i) => {
                    let statusInfo = STATUS_BADGE[r.status] || STATUS_BADGE.unmapped;
                    if (r.needs_review && r.status === 'mapped') {
                      statusInfo = { cls: 'badge-warning', label: 'Review Required' };
                    }
                    const methodCls  = METHOD_BADGE[r.mapping_method] || 'badge-danger';
                    
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                        className={`glass-panel p-8 relative overflow-hidden group border-l-[6px] shadow-premium ${
                          r.status === 'mapped' ? 'border-l-status-success' : 'border-l-status-danger'
                        } hover:translate-x-1 transition-transform`}
                      >
                        <div className="flex items-start justify-between mb-6 relative z-10">
                          <div className="min-w-0 space-y-2">
                            <h4 className="text-xl font-black text-luxury-text-primary capitalize truncate tracking-tight">{r.ingredient}</h4>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`badge ${statusInfo.cls} px-3 py-1 shadow-sm`}>{statusInfo.label}</span>
                              <span className={`badge ${methodCls} font-black px-3 py-1 shadow-sm`}>{r.mapping_method.toUpperCase()}</span>
                            </div>
                          </div>
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-premium ${r.status === 'mapped' ? 'text-status-success bg-status-success/10' : 'text-status-danger bg-status-danger/10'}`}>
                            {r.status === 'mapped' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                          </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                          <div className="flex items-center justify-between bg-luxury-cream/50 rounded-2xl px-6 py-4 border border-luxury-border/50">
                            <div className="flex items-center gap-3 min-w-0">
                               <Quote size={14} className="text-luxury-gold shrink-0" />
                               <span className="text-xs text-luxury-text-secondary font-bold italic truncate max-w-[180px]">"{r.cleaned_text}"</span>
                            </div>
                             <div className="flex items-baseline gap-2 shrink-0">
                                <span className={`text-2xl font-black tabular-nums ${r.quantity == null ? 'text-status-danger animate-pulse' : 'text-luxury-gold'}`}>
                                  {r.quantity != null ? r.quantity.toFixed(2) : '—'}
                                </span>
                                <span className="text-[10px] font-black text-luxury-gold/50 uppercase tracking-widest">{r.unit || 'MISSING'}</span>
                             </div>
                           </div>

                           {r.quantity == null && (
                             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-status-danger/10 border border-status-danger/20 mb-4">
                               <AlertCircle size={14} className="text-status-danger" />
                               <span className="text-[9px] font-black text-status-danger uppercase tracking-widest">Quantity missing — review required</span>
                             </div>
                           )}
                          
                          <div className="space-y-3 px-1">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                              <span className="text-luxury-text-muted">Extraction Confidence</span>
                              <span className={r.confidence > 80 ? 'text-status-success' : 'text-luxury-gold'}>{Math.round(r.confidence)}%</span>
                            </div>
                            <div className="h-2 w-full bg-luxury-border/30 rounded-full overflow-hidden border border-luxury-border/30">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${r.confidence}%` }}
                                transition={{ duration: 1.2, delay: 0.4 }}
                                className={`h-full rounded-full ${
                                  r.confidence > 80 ? 'bg-status-success shadow-sm' : r.confidence > 60 ? 'bg-luxury-gold shadow-sm' : 'bg-status-danger'
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
                    className="btn-secondary w-full h-16 text-[11px] uppercase tracking-[0.3em] font-black mt-6 border-dashed hover:bg-white"
                  >
                    Reset Operational Stream
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
