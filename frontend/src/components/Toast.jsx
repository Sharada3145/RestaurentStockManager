import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X, XCircle, Zap, Sparkles } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Sparkles,
};

const STYLES = {
  success: 'border-status-success/20 bg-status-success/5 text-status-success shadow-[0_10px_30px_rgba(16,185,129,0.1)]',
  error:   'border-status-danger/20 bg-status-danger/5 text-status-danger shadow-[0_10px_30px_rgba(239,68,68,0.1)]',
  warning: 'border-status-warning/20 bg-status-warning/5 text-status-warning shadow-[0_10px_30px_rgba(245,158,11,0.1)]',
  info:    'border-luxury-gold/20 bg-luxury-gold/5 text-luxury-gold shadow-gold',
};

export function Toast({ id, message, type = 'info', onDismiss }) {
  const Icon = ICONS[type] || Sparkles;
  const cls  = STYLES[type] || STYLES.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1   }}
      exit={{    opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`pointer-events-auto flex w-96 items-center gap-5 rounded-[20px] border px-6 py-5 backdrop-blur-3xl glass-panel bg-white/95 ${cls}`}
    >
      <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-current opacity-30 shadow-sm`}>
         <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed italic">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white/50 border border-luxury-border text-luxury-text-muted hover:text-luxury-text-primary transition-all shadow-sm"
        aria-label="Dismiss Intelligence"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
