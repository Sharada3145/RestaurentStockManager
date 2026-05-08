import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 32, label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ width: size, height: size }}
        className="rounded-full border-2 border-surface-600 border-t-brand-500"
      />
      {label && <p className="text-sm text-slate-500 animate-pulse">{label}</p>}
    </div>
  );
}
