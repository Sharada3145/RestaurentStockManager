export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`glass-card p-5 space-y-3 animate-pulse ${className}`}>
      <div className="skeleton h-4 w-1/3 rounded-lg" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3 rounded-lg ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="border-b border-white/[0.06] px-6 py-4">
        <div className="skeleton h-4 w-1/4 rounded-lg" />
      </div>
      <div className="divide-y divide-white/[0.04]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <div className="skeleton h-4 w-1/4 rounded-lg" />
            <div className="skeleton h-4 w-1/6 rounded-lg" />
            <div className="skeleton h-4 w-1/6 rounded-lg" />
            <div className="skeleton h-4 w-1/4 rounded-lg ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}
