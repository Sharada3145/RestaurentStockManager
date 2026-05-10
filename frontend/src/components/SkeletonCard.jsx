export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`glass-panel p-8 space-y-6 animate-pulse border-luxury-gold/5 bg-white/40 shadow-sm ${className}`}>
      <div className="h-8 w-1/3 rounded-2xl bg-luxury-gold/5" />
      <div className="space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`h-5 rounded-xl bg-luxury-gold/[0.03] ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="glass-panel overflow-hidden animate-pulse border-luxury-gold/5 bg-white/60 shadow-premium">
      <div className="border-b border-luxury-border/30 px-10 py-8 bg-white/80">
        <div className="h-8 w-1/4 rounded-2xl bg-luxury-gold/5" />
      </div>
      <div className="divide-y divide-luxury-border/20">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-10 px-10 py-8">
            <div className="h-6 w-1/4 rounded-xl bg-luxury-gold/[0.03]" />
            <div className="h-6 w-1/6 rounded-xl bg-luxury-gold/[0.02]" />
            <div className="h-6 w-1/6 rounded-xl bg-luxury-gold/[0.02]" />
            <div className="h-6 w-1/4 rounded-xl bg-luxury-gold/[0.03] ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={1} className="h-44" />
      ))}
    </div>
  );
}
