import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, Tag, AlertCircle, CheckCircle2, ChevronRight, Fingerprint, History } from 'lucide-react';

function timeAgo(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ActivityRow({ item, compact, theme = 'warm' }) {
  const isPending = item.id < 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className={`group flex items-center gap-6 px-10 py-6 border-b border-luxury-border/30 last:border-0 hover:bg-luxury-gold/[0.02] transition-all ${isPending ? 'opacity-40 grayscale' : ''}`}
    >
      {/* Icon dot */}
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 transition-all duration-500 group-hover:scale-110 shadow-sm ${
        item.needs_review 
          ? 'bg-luxury-gold/10 border-luxury-gold/20 text-luxury-gold shadow-gold' 
          : 'bg-status-success/10 border-status-success/20 text-status-success shadow-sm'
      }`}>
        {item.needs_review ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-lg font-black text-luxury-text-primary capitalize truncate tracking-tight group-hover:text-luxury-gold transition-colors">{item.ingredient}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold/20 shrink-0" />
            <div className="flex items-baseline gap-1.5 shrink-0">
               <span className="text-base font-black text-luxury-text-primary/60 tabular-nums">
                 {item.quantity?.toFixed(1)}
               </span>
               <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-widest">
                 {item.unit}
               </span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-luxury-border shadow-sm">
             <Clock size={12} className="text-luxury-gold" />
             <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-widest tabular-nums whitespace-nowrap">
               {timeAgo(item.logged_at)}
             </span>
          </div>
        </div>
        
        {!compact && (
          <div className="flex items-center gap-8 text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em] pt-1">
            <span className="flex items-center gap-2.5"><Fingerprint size={14} className="text-luxury-gold" /> Chef {item.chef_name}</span>
            <span className="flex items-center gap-2.5"><Tag size={14} className="text-luxury-terracotta" /> {item.mapping_method}</span>
            {item.needs_review && <span className="text-status-warning font-black animate-pulse">Review Priority</span>}
          </div>
        )}
        
        {compact && (
          <div className="flex items-center gap-2 text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.15em] truncate">
            Chef {item.chef_name} <ChevronRight size={12} className="text-luxury-gold" /> Active Shift Log
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ActivityFeed({ items = [], compact = false, theme = 'warm' }) {
  return (
    <div className="glass-panel overflow-hidden border-luxury-border/50 shadow-premium bg-white/60">
      {!compact && (
        <div className="border-b border-luxury-border/30 px-10 py-6 flex items-center justify-between bg-white/80">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 flex items-center justify-center text-luxury-gold shadow-sm">
                <History size={18} />
             </div>
             <h3 className="text-xs font-black text-luxury-text-primary uppercase tracking-[0.3em]">Operational Timeline</h3>
          </div>
          <span className="badge-gold px-4 py-1.5 shadow-sm">{items.length} TOTAL LOGS</span>
        </div>
      )}
      <div className={`${compact ? 'max-h-[380px]' : 'max-h-[640px]'} overflow-y-auto custom-scrollbar`}>
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6 text-luxury-text-muted/20">
              <div className="w-20 h-20 rounded-[32px] bg-luxury-cream border border-luxury-border flex items-center justify-center shadow-premium">
                 <Clock size={40} />
              </div>
              <div className="text-center space-y-1">
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] text-luxury-text-primary">No Intelligence Stream</p>
                 <p className="text-[10px] font-bold uppercase tracking-widest">Awaiting operational activity...</p>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <ActivityRow key={item.id} item={item} compact={compact} theme={theme} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
