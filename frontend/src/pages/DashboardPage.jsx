import { motion } from 'framer-motion';
import { Activity, AlertTriangle, BarChart3, Box, RefreshCw, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ActivityFeed } from '../components/ActivityFeed';
import { StatCard } from '../components/StatCard';
import { SkeletonStatGrid } from '../components/SkeletonCard';
import { useDashboard } from '../context/DashboardContext';

const COLORS = ['#6366f1','#2dd4bf','#fbbf24','#fb7185','#34d399','#a78bfa'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="font-semibold text-slate-300 mb-1 capitalize">{label}</p>
      <p className="text-brand-400 font-mono">{Number(payload[0].value).toFixed(3)}</p>
    </div>
  );
};

export function DashboardPage({ onRefresh, notify }) {
  const { inventory, usage, activity, counters, loading, refreshing } = useDashboard();

  const alertCount    = inventory.filter((i) => i.alert).length;
  const totalIngr     = inventory.length;

  // Top-10 usage for bar chart
  const chartData = Object.entries(usage.total_usage || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name: name.length > 10 ? name.slice(0,10)+'…' : name, value: +value.toFixed(3) }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time kitchen inventory intelligence</p>
        </div>
        <button
          onClick={() => onRefresh({ silent: true })}
          disabled={refreshing}
          className="btn-secondary gap-2"
        >
          <motion.span animate={{ rotate: refreshing ? 360 : 0 }} transition={{ duration: 1, repeat: refreshing ? Infinity : 0, ease: 'linear' }}>
            <RefreshCw size={14} />
          </motion.span>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Stats grid */}
      {loading ? (
        <SkeletonStatGrid count={4} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Tracked (kg)" value={counters.totalTracked.toFixed(1)} icon={TrendingUp} color="brand" />
          <StatCard label="Inventory Items"    value={totalIngr}                          icon={Box}        color="teal" />
          <StatCard label="Active Alerts"      value={alertCount}                         icon={AlertTriangle} color={alertCount > 0 ? 'rose' : 'emerald'} />
          <StatCard label="Unmapped Queue"     value={counters.unmappedCount}             icon={Activity}   color="violet" />
        </div>
      )}

      {/* Chart + Activity */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Usage bar chart */}
        <div className="glass-card p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Top Ingredient Usage</h3>
            <span className="badge badge-brand"><BarChart3 size={10} /> All time</span>
          </div>
          {chartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-500">
              Submit stock entries to see usage analytics.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2">
          <ActivityFeed items={activity} />
        </div>
      </div>

      {/* Alert cards */}
      {alertCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">⚠ Low Stock Alerts</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inventory.filter((i) => i.alert).map((item) => (
              <div key={item.ingredient} className="glass-card border-accent-amber/20 bg-accent-amber/5 p-4 flex items-start gap-3">
                <AlertTriangle size={16} className="text-accent-amber mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-200 capitalize">{item.ingredient}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.alert}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">{item.current_stock.toFixed(2)} {item.unit} remaining</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
