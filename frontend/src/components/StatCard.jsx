import { motion } from 'framer-motion';

export function StatCard({ label, value, icon: Icon, color = 'brand', trend, suffix = '' }) {
  const colorMap = {
    brand:   'from-brand-500/20 to-brand-600/5 border-brand-500/20 text-brand-400',
    teal:    'from-accent-teal/20 to-accent-teal/5 border-accent-teal/20 text-accent-teal',
    amber:   'from-accent-amber/20 to-accent-amber/5 border-accent-amber/20 text-accent-amber',
    rose:    'from-accent-rose/20 to-accent-rose/5 border-accent-rose/20 text-accent-rose',
    emerald: 'from-accent-emerald/20 to-accent-emerald/5 border-accent-emerald/20 text-accent-emerald',
    violet:  'from-accent-violet/20 to-accent-violet/5 border-accent-violet/20 text-accent-violet',
  };

  const cls = colorMap[color] || colorMap.brand;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-card-hover p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br border ${cls}`}>
            <Icon size={17} />
          </span>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span className="stat-value">
          {value ?? <span className="skeleton inline-block h-8 w-16 rounded-lg" />}
        </span>
        {suffix && <span className="mb-1 text-sm text-slate-400">{suffix}</span>}
      </div>

      {trend !== undefined && (
        <p className={`text-xs font-medium ${trend >= 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last week
        </p>
      )}
    </motion.div>
  );
}
