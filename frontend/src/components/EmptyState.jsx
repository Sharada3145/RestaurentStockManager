export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-4 py-20 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-700/60 border border-white/[0.06] text-slate-500">
          <Icon size={26} />
        </div>
      )}
      <div>
        <h3 className="text-base font-semibold text-slate-300">{title}</h3>
        {message && <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto">{message}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
