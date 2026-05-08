import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: 'border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald',
  error:   'border-accent-rose/30   bg-accent-rose/10   text-accent-rose',
  warning: 'border-accent-amber/30  bg-accent-amber/10  text-accent-amber',
  info:    'border-brand-500/30     bg-brand-500/10     text-brand-400',
};

export function Toast({ id, title, message, type = 'info', onDismiss }) {
  const Icon = ICONS[type] || Info;
  const cls  = STYLES[type] || STYLES.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0,  scale: 1   }}
      exit={{    opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl backdrop-blur-sm ${cls}`}
    >
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        {message && <p className="text-xs opacity-75 mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="ml-1 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastStack({ toasts = [], onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
