import { motion } from 'framer-motion';
import { Bell, Menu, Moon, RefreshCw, Sun, Wifi, WifiOff } from 'lucide-react';

export function Navbar({ onMenuClick, darkMode, onToggleTheme, health, refreshing, onRefresh, alertCount = 0 }) {
  const isOnline = health?.status === 'ok';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.06] bg-surface-900/80 backdrop-blur-xl px-4 sm:px-6">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-surface-700/60 hover:text-white transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Title */}
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-white hidden sm:block">
          Restaurant Intelligence Platform
        </h2>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* API status pill */}
        <div className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
          isOnline
            ? 'border-accent-emerald/25 bg-accent-emerald/10 text-accent-emerald'
            : 'border-accent-rose/25 bg-accent-rose/10 text-accent-rose'
        }`}>
          {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
          {isOnline ? 'API Online' : 'Offline'}
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-surface-700/60 hover:text-white transition-colors disabled:opacity-50"
          aria-label="Refresh data"
        >
          <motion.span animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
            <RefreshCw size={16} />
          </motion.span>
        </button>

        {/* Alerts bell */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-surface-700/60 hover:text-white transition-colors">
          <Bell size={16} />
          {alertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-rose text-[9px] font-bold text-white">
              {alertCount}
            </span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-surface-700/60 hover:text-white transition-colors"
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
