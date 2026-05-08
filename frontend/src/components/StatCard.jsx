import { motion } from 'framer-motion';

export function StatCard({ label, value, icon: Icon, color = 'brand', trend, suffix = '' }) {
  const colorMap = {
    brand:   'text-brand-400 bg-brand-500/10 border-brand-500/20',
    teal:    'text-accent-teal bg-accent-teal/10 border-accent-teal/20',
    amber:   'text-accent-amber bg-accent-amber/10 border-accent-amber/20',
    rose:    'text-accent-rose bg-accent-rose/10 border-accent-rose/20',
    emerald: 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20',
    violet:  'text-accent-violet bg-accent-violet/10 border-accent-violet/20',
  };

  const cls = colorMap[color] || colorMap.brand;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="kpi-card group hover:border-white/10 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-400 transition-colors">
            {label}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-white tracking-tight tabular-nums">
              {value ?? '—'}
            </span>
            {suffix && <span className="text-sm font-medium text-slate-500">{suffix}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${cls}`}>
            <Icon size={18} />
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1.5">
          <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            trend >= 0 ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'
          }`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </div>
          <span className="text-[10px] font-medium text-slate-500">vs yesterday</span>
        </div>
      )}
    </motion.div>
  );
}
