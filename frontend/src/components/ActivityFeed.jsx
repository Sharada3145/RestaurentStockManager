import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, Tag, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';

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

function ActivityRow({ item, compact }) {
  const isPending = item.id < 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className={`group flex items-center gap-4 px-5 py-4 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors ${isPending ? 'opacity-60' : ''}`}
    >
      {/* Icon dot */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
        item.needs_review 
          ? 'bg-accent-amber/5 border-accent-amber/20 text-accent-amber' 
          : 'bg-accent-emerald/5 border-accent-emerald/20 text-accent-emerald'
      }`}>
        {item.needs_review ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-bold text-white capitalize truncate">{item.ingredient}</span>
            <ChevronRight size={12} className="text-slate-600 shrink-0" />
            <span className="text-xs font-medium text-slate-400">
              {item.quantity?.toFixed(2)} {item.unit}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
            {timeAgo(item.logged_at)}
          </span>
        </div>
        
        {!compact && (
          <div className="mt-1 flex items-center gap-4 text-[10px] font-medium text-slate-500">
            <span className="flex items-center gap-1"><User size={10} className="text-brand-400" />{item.chef_name}</span>
            <span className="flex items-center gap-1 capitalize"><Tag size={10} className="text-slate-600" />{item.mapping_method}</span>
            {item.needs_review && <span className="text-accent-amber font-bold">Needs Review</span>}
          </div>
        )}
        
        {compact && (
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500 italic truncate">
            Chef {item.chef_name} recorded usage from kitchen
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ActivityFeed({ items = [], compact = false }) {
  return (
    <div className="glass-card overflow-hidden">
      {!compact && (
        <div className="border-b border-white/[0.05] px-5 py-4 flex items-center justify-between bg-white/[0.01]">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Global Activity</h3>
          <span className="badge-info px-2 py-0.5">{items.length} Events</span>
        </div>
      )}
      <div className={`${compact ? 'max-h-[320px]' : 'max-h-[500px]'} overflow-y-auto scrollbar-hide`}>
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Clock size={32} className="opacity-20" />
              <p className="text-xs">No recent logs found.</p>
            </div>
          ) : (
            items.map((item) => (
              <ActivityRow key={item.id} item={item} compact={compact} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
