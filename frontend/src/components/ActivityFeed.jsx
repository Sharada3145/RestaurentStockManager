import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, Tag, AlertCircle, CheckCircle } from 'lucide-react';

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

function ActivityRow({ item }) {
  const isPending = item.id < 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0 hover:bg-surface-700/20 transition-colors ${isPending ? 'opacity-70' : ''}`}
    >
      {/* Icon dot */}
      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.needs_review ? 'bg-accent-amber/15' : 'bg-accent-emerald/15'}`}>
        {item.needs_review
          ? <AlertCircle size={13} className="text-accent-amber" />
          : <CheckCircle size={13} className="text-accent-emerald" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-200 capitalize">{item.ingredient}</span>
          {item.quantity != null && (
            <span className="font-mono text-xs text-slate-400">
              {item.quantity.toFixed(3)} {item.unit}
            </span>
          )}
          <span className="badge badge-brand text-[10px]">{item.mapping_method}</span>
          {item.needs_review && <span className="badge badge-amber text-[10px]">Review</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><User size={10} />{item.chef_name}</span>
          <span className="flex items-center gap-1"><Tag size={10} />{Math.round(item.confidence)}%</span>
          <span className="flex items-center gap-1"><Clock size={10} />{timeAgo(item.logged_at)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function ActivityFeed({ items = [] }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="border-b border-white/[0.06] px-4 py-3.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Recent Activity</h3>
        <span className="badge badge-brand">{items.length}</span>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <AnimatePresence>
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">No activity yet.</p>
          ) : (
            items.map((item) => <ActivityRow key={item.id} item={item} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
