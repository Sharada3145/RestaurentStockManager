import { motion } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';

export function LoadingSpinner({ size = 56, label = 'Calibrating Intelligence...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-32">
      <div className="relative">
         <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
           style={{ width: size, height: size }}
           className="rounded-full border-4 border-luxury-gold/10 border-t-luxury-gold shadow-gold"
         />
         <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={size/2} className="text-luxury-gold animate-pulse" />
         </div>
      </div>
      {label && <p className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.4em] animate-pulse italic">{label}</p>}
    </div>
  );
}
