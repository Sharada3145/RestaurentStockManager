import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Users, Target, TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import { getAnalyticsSummary, getTimeline, getCategoryUsage } from '../services/api';

const PIE_COLORS = ['#6366f1','#2dd4bf','#fbbf24','#fb7185','#34d399','#a78bfa','#f97316','#38bdf8'];

function KPICard({ label, value, sub, icon: Icon, color = 'brand' }) {
  const colorMap = {
    brand: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
    teal:  'text-accent-teal bg-accent-teal/10 border-accent-teal/20',
    amber: 'text-accent-amber bg-accent-amber/10 border-accent-amber/20',
    violet:'text-accent-violet bg-accent-violet/10 border-accent-violet/20',
    emerald:'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border mb-3 ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </motion.div>
  );
}

function CustomLineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-brand-400 font-mono">{Number(payload[0].value).toFixed(3)}</p>
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-slate-200 capitalize font-semibold">{payload[0].name}</p>
      <p className="text-brand-400 font-mono">{Number(payload[0].value).toFixed(3)}</p>
    </div>
  );
}

export function AnalyticsPage() {
  const { usage, loading: ctxLoading, refreshDashboard, refreshing } = useDashboard();
  const [summary,      setSummary]      = useState(null);
  const [timeline,     setTimeline]     = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [fetching,     setFetching]     = useState(true);

  const load = async () => {
    setFetching(true);
    try {
      const [sum, tl, cat] = await Promise.allSettled([
        getAnalyticsSummary(),
        getTimeline(30),
        getCategoryUsage(),
      ]);
      if (sum.status  === 'fulfilled') setSummary(sum.value);
      if (tl.status   === 'fulfilled') setTimeline(tl.value);
      if (cat.status  === 'fulfilled') setCategoryData(cat.value);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chefRows = Object.entries(usage?.by_chef || {})
    .map(([chef, items]) => ({
      chef,
      total: Object.values(items).reduce((a, b) => a + b, 0),
      top: Object.entries(items).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—',
    }))
    .sort((a, b) => b.total - a.total);

  const isLoading = fetching || ctxLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational intelligence — usage trends, accuracy metrics, and chef performance.
          </p>
        </div>
        <button
          onClick={() => { refreshDashboard({ silent: true }); load(); }}
          disabled={refreshing || fetching}
          className="btn-secondary gap-2"
        >
          <motion.span
            animate={{ rotate: (refreshing || fetching) ? 360 : 0 }}
            transition={{ duration: 1, repeat: (refreshing || fetching) ? Infinity : 0, ease: 'linear' }}
          >
            <RefreshCw size={14} />
          </motion.span>
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 size={28} className="animate-spin text-brand-400" />
        </div>
      ) : (
        <>
          {/* KPI grid */}
          {summary && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <KPICard label="Total Entries"   value={summary.total_entries}  icon={BarChart2}  color="brand" />
              <KPICard label="ML Accuracy"     value={`${summary.accuracy_rate}%`} icon={Target} color="emerald" sub={`${summary.mapped_entries} mapped`} />
              <KPICard label="Unmapped Queue"  value={summary.unmapped_count} icon={TrendingUp}  color="amber" />
              <KPICard label="Active Chefs"    value={summary.unique_chefs}   icon={Users}       color="teal" />
              <KPICard label="Top Ingredient"  value={summary.top_ingredient || '—'} icon={BarChart2} color="violet" />
            </div>
          )}

          {/* Timeline chart + Category donut */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Line chart */}
            <div className="glass-card p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Daily Usage — Last 30 Days</h3>
              {timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={timeline} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                    />
                    <Tooltip content={<CustomLineTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="quantity"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: '#818cf8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500 text-center py-16">Submit stock entries to see usage trends.</p>
              )}
            </div>

            {/* Donut chart */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Usage by Category</h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="quantity"
                      nameKey="category"
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend
                      iconSize={8}
                      formatter={(v) => (
                        <span className="text-slate-400 text-xs capitalize">{v}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500 text-center py-16">No category data yet.</p>
              )}
            </div>
          </div>

          {/* Chef leaderboard */}
          {chefRows.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <Users size={14} className="text-accent-teal" /> Chef Leaderboard
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-widest text-slate-500 border-b border-white/[0.06]">
                      <th className="pb-2 text-left font-medium">#</th>
                      <th className="pb-2 text-left font-medium">Chef</th>
                      <th className="pb-2 text-left font-medium">Top Ingredient</th>
                      <th className="pb-2 text-right font-medium">Total Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chefRows.map((row, i) => (
                      <motion.tr
                        key={row.chef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-white/[0.04] hover:bg-surface-700/30 transition-colors"
                      >
                        <td className="py-3 text-slate-500 text-xs">{i + 1}</td>
                        <td className="py-3 text-slate-200 font-medium">{row.chef}</td>
                        <td className="py-3 text-slate-400 capitalize">{row.top}</td>
                        <td className="py-3 text-right font-mono text-brand-400">{row.total.toFixed(3)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
