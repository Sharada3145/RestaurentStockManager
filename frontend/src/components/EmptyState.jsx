export function EmptyState({ icon: Icon, title, message, action, theme = 'warm' }) {
  return (
    <div className="glass-panel flex flex-col items-center justify-center gap-10 py-32 text-center border-luxury-gold/5 bg-white/40 shadow-premium">
      {Icon && (
        <div className="flex h-24 w-24 items-center justify-center rounded-[40px] bg-white border border-luxury-border text-luxury-gold shadow-premium animate-float">
          <Icon size={48} />
        </div>
      )}
      <div className="space-y-4">
        <h3 className="text-3xl font-black text-luxury-text-primary tracking-tight">{title}</h3>
        {message && <p className="text-base font-medium text-luxury-text-muted max-w-md mx-auto leading-relaxed">{message}</p>}
      </div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
