import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatCard({ label, value, icon: Icon, color = 'gold', trend, suffix = '' }) {
  const colorMap = {
    gold: 'text-luxury-gold bg-luxury-gold/10 border-luxury-gold/20 shadow-gold',
    terracotta: 'text-luxury-terracotta bg-luxury-terracotta/10 border-luxury-terracotta/20',
    olive: 'text-luxury-olive bg-luxury-olive/10 border-luxury-olive/20',
    burgundy: 'text-luxury-burgundy bg-luxury-burgundy/10 border-luxury-burgundy/20',
    emerald: 'text-status-success bg-status-success/10 border-status-success/20',
    cream: 'text-luxury-text-primary bg-luxury-cream border-luxury-border',
  };

  const cls = colorMap[color] || colorMap.gold;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass-panel p-10 group relative overflow-hidden transition-all duration-500 border-luxury-gold/5"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/[0.02] blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-luxury-gold/[0.05] transition-colors" />

      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-luxury-text-muted group-hover:text-luxury-gold transition-colors">
            {label}
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-luxury-text-primary tracking-tighter tabular-nums leading-none">
              {value ?? '—'}
            </span>
            {suffix && (
              <span className="text-[11px] font-black text-luxury-text-muted uppercase tracking-widest">
                {suffix}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm ${cls}`}>
            <Icon size={24} />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-8 flex items-center gap-3 relative z-10">
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black border shadow-sm ${trend.positive
              ? 'bg-status-success/10 text-status-success border-status-success/20'
              : 'bg-status-danger/10 text-status-danger border-status-danger/20'
            }`}>
            {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend.value)}%
          </div>
          <span className="text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest">vs previous shift</span>
        </div>
      )}
    </motion.div>
  );
}
