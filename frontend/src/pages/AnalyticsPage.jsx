import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, Users, Target, TrendingUp, Loader2, RefreshCw,
  PieChart as PieIcon, Layers, UserCircle, Sparkles, Activity
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';
import { getAnalyticsSummary, getTimeline, getCategoryUsage } from '../services/api';

const PIE_COLORS = ['#C9A227', '#C97A40', '#6B8E23', '#7A1F3D', '#3B82F6', '#10B981', '#F59E0B', '#6366F1'];

function KPICard({ label, value, sub, icon: Icon, color = 'gold' }) {
  const colorMap = {
    gold: 'text-luxury-gold bg-luxury-gold/10 border-luxury-gold/20 shadow-gold',
    emerald: 'text-status-success bg-status-success/10 border-status-success/20',
    terracotta: 'text-luxury-terracotta bg-luxury-terracotta/10 border-luxury-terracotta/20',
    burgundy: 'text-luxury-burgundy bg-luxury-burgundy/10 border-luxury-burgundy/20',
    cream: 'text-luxury-text-primary bg-luxury-cream border-luxury-border',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-panel p-8 group relative overflow-hidden transition-all duration-500 border-luxury-gold/5 shadow-premium"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-gold/[0.02] blur-3xl rounded-full -mr-12 -mt-12 group-hover:bg-luxury-gold/[0.05] transition-colors" />

      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border-2 mb-6 transition-all duration-500 group-hover:scale-110 ${colorMap[color] || colorMap.gold}`}>
        <Icon size={24} />
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">{label}</p>
        <p className="text-3xl font-black text-luxury-text-primary tracking-tighter group-hover:text-luxury-gold transition-colors">{value}</p>
        {sub && <p className="text-[10px] font-black text-luxury-gold uppercase tracking-widest mt-3 opacity-60 italic">{sub}</p>}
      </div>
    </motion.div>
  );
}

function CustomLineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-6 py-4 border-luxury-gold/20 shadow-gold bg-white/95">
      <p className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.2em] mb-2">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-black text-luxury-text-primary">{Number(payload[0].value).toFixed(2)}</span>
        <span className="text-[10px] text-luxury-text-muted uppercase font-bold tracking-widest">kg/l</span>
      </div>
    </div>
  );
}

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-6 py-4 border-luxury-gold/20 shadow-gold bg-white/95">
      <p className="text-sm font-black text-luxury-text-primary capitalize mb-2">{payload[0].name}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-xl font-black text-luxury-gold">{Number(payload[0].value).toFixed(2)}</span>
        <span className="text-[10px] text-luxury-text-muted uppercase font-bold tracking-widest">kg/l</span>
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const { usage, loading: ctxLoading, refreshDashboard, refreshing } = useDashboard();
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [fetching, setFetching] = useState(true);

  const load = async () => {
    setFetching(true);
    try {
      const [sum, tl, cat] = await Promise.allSettled([
        getAnalyticsSummary(),
        getTimeline(30),
        getCategoryUsage(),
      ]);
      if (sum.status === 'fulfilled') setSummary(sum.value);
      if (tl.status === 'fulfilled') setTimeline(tl.value);
      if (cat.status === 'fulfilled') setCategoryData(cat.value);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { load(); }, []);

  const chefRows = Object.entries(usage?.by_chef || {})
    .map(([chef, items]) => ({
      chef,
      total: Object.values(items).reduce((a, b) => a + b, 0),
      top: Object.entries(items).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
    }))
    .sort((a, b) => b.total - a.total);

  const isLoading = fetching || ctxLoading;

  return (
    <div className="space-y-16 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 rounded-[32px] bg-luxury-gradient flex items-center justify-center text-white shadow-gold-lg">
            <BarChart2 size={40} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.3em]">Executive Module</span>
              <div className="h-px w-8 bg-luxury-gold/30" />
            </div>
            <h1 className="text-5xl font-black text-luxury-text-primary tracking-tight">Performance Analytics</h1>
            <p className="text-luxury-text-muted text-sm font-medium">Strategic intelligence dashboard — usage trends, ML model efficiency, and chef-level metrics.</p>
          </div>
        </div>

        <button
          onClick={() => { refreshDashboard({ silent: true }); load(); }}
          disabled={refreshing || fetching}
          className="btn-secondary h-16 px-10 shadow-sm"
        >
          <RefreshCw size={20} className={`${(refreshing || fetching) ? 'animate-spin text-luxury-gold' : 'text-luxury-gold'}`} />
          <span className="font-black uppercase tracking-widest text-[11px]">Sync Analytics</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96 gap-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-luxury-gold/10 border-t-luxury-gold animate-spin shadow-gold" />
            <div className="absolute inset-0 flex items-center justify-center text-luxury-gold">
              <Sparkles size={28} className="animate-pulse" />
            </div>
          </div>
          <p className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.4em] animate-pulse">Reconstructing Neural Data...</p>
        </div>
      ) : (
        <>
          {/* KPI grid */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
              <KPICard label="Aggregate Intake" value={summary.total_entries} icon={Layers} color="gold" />
              <KPICard label="Cognitive Accuracy" value={`${summary.accuracy_rate}%`} icon={Target} color="emerald" sub={`${summary.mapped_entries} Mapped Items`} />
              <KPICard label="Audit Backlog" value={summary.unmapped_count} icon={Activity} color="burgundy" />
              <KPICard label="Staff Identity Count" value={summary.unique_chefs} icon={Users} color="terracotta" />
              <KPICard label="Primary Asset" value={summary.top_ingredient || '—'} icon={BarChart2} color="cream" />
            </div>
          )}

          {/* Timeline chart + Category donut */}
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Area chart */}
            <div className="glass-panel p-12 lg:col-span-2 border-luxury-gold/5 bg-white/70 shadow-premium">
              <div className="flex items-center justify-between mb-16">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-luxury-text-primary tracking-tight">Shift Velocity Timeline</h3>
                  <p className="text-sm font-medium text-luxury-text-muted">Total inventory deduction volume — Last 30 Operational Shifts</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-luxury-gold/5 border border-luxury-gold/10 flex items-center justify-center text-luxury-gold shadow-sm">
                  <TrendingUp size={24} />
                </div>
              </div>

              {timeline.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeline} margin={{ left: -20, right: 10, top: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="luxuryAnalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A227" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#C9A227" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,42,38,0.05)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 800 }}
                        axisLine={false}
                        tickLine={false}
                        interval={4}
                        dy={20}
                      />
                      <YAxis
                        tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 800 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <ChartTooltip content={<CustomLineTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="quantity"
                        stroke="#C9A227"
                        strokeWidth={5}
                        fillOpacity={1}
                        fill="url(#luxuryAnalGrad)"
                        animationDuration={2500}
                        activeDot={{ r: 10, fill: '#C9A227', stroke: '#fff', strokeWidth: 4, shadow: '0 10px 20px rgba(201,162,39,0.3)' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center gap-10 border-4 border-dashed border-luxury-border rounded-[40px] bg-white/30">
                  <Activity size={48} className="text-luxury-text-muted/20" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-luxury-text-muted">Intelligence stream pending</p>
                </div>
              )}
            </div>

            {/* Donut chart */}
            <div className="glass-panel p-12 border-luxury-gold/5 bg-white/70 shadow-premium">
              <div className="flex items-center justify-between mb-16">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-luxury-text-primary tracking-tight">Category Mix</h3>
                  <p className="text-sm font-medium text-luxury-text-muted">Usage distribution by ingredient cluster</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-luxury-gold/5 border border-luxury-gold/10 flex items-center justify-center text-luxury-gold shadow-sm">
                  <PieIcon size={24} />
                </div>
              </div>

              {categoryData.length > 0 ? (
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="quantity"
                        nameKey="category"
                        cx="50%"
                        cy="45%"
                        innerRadius={80}
                        outerRadius={115}
                        paddingAngle={8}
                        stroke="none"
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} className="hover:opacity-80 transition-opacity" />
                        ))}
                      </Pie>
                      <ChartTooltip content={<CustomPieTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{ paddingTop: '30px' }}
                        formatter={(v) => (
                          <span className="text-[11px] font-black text-luxury-text-muted uppercase tracking-widest ml-2">{v}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-32 flex flex-col items-center justify-center gap-10 border-4 border-dashed border-luxury-border rounded-[40px] bg-white/30">
                  <PieIcon size={48} className="text-luxury-text-muted/20" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-luxury-text-muted">No cluster data</p>
                </div>
              )}
            </div>
          </div>

          {/* Chef leaderboard */}
          {chefRows.length > 0 && (
            <div className="space-y-10">
              <div className="flex items-center gap-6 px-4">
                <div className="w-12 h-12 rounded-2xl bg-luxury-gold/10 flex items-center justify-center text-luxury-gold shadow-sm">
                  <Users size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-luxury-gold uppercase tracking-[0.4em]">Kitchen Roster Intelligence</h3>
                  <h2 className="text-3xl font-black text-luxury-text-primary tracking-tight">Operator Performance</h2>
                </div>
              </div>

              <div className="data-table-container border-luxury-gold/5 shadow-premium">
                <table className="w-full">
                  <thead>
                    <tr className="data-table-header">
                      <th className="px-10 py-6 text-left font-black">Rank</th>
                      <th className="px-10 py-6 text-left font-black">Operator Profile</th>
                      <th className="px-10 py-6 text-left font-black">Strategic Commodity</th>
                      <th className="px-10 py-6 text-right font-black">Cumulative Operational Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-luxury-border/30">
                    {chefRows.map((row, i) => (
                      <motion.tr
                        key={row.chef}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1, duration: 0.6 }}
                        className="data-table-row group"
                      >
                        <td className="px-10 py-8">
                          <span className="w-10 h-10 rounded-xl bg-luxury-cream border border-luxury-border flex items-center justify-center text-[12px] font-black text-luxury-text-muted group-hover:bg-luxury-gold group-hover:text-white group-hover:shadow-gold-lg transition-all">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-luxury-gradient flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110">
                              <UserCircle size={24} />
                            </div>
                            <span className="text-lg font-black text-luxury-text-primary group-hover:text-luxury-gold transition-colors">{row.chef}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className="badge-gold font-black px-4 py-1.5 shadow-sm uppercase tracking-widest">{row.top}</span>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-baseline justify-end gap-3 font-mono">
                            <span className="text-2xl font-black text-luxury-gold tabular-nums">{row.total.toFixed(2)}</span>
                            <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">Inventory Units</span>
                          </div>
                        </td>
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
