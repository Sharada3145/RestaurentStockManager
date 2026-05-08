import { motion } from 'framer-motion';
import { 
  Activity, AlertTriangle, BarChart3, Box, RefreshCw, 
  TrendingUp, Package, ShoppingCart, User, Clock, CheckCircle2
} from 'lucide-react';
import { 
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, 
  Tooltip, XAxis, YAxis 
} from 'recharts';
import { ActivityFeed } from '../components/ActivityFeed';
import { StatCard } from '../components/StatCard';
import { InventoryTable } from '../components/InventoryTable';
import { PredictionChart } from '../components/PredictionChart';
import { useDashboard } from '../context/DashboardContext';

const COLORS = ['#6366f1','#2dd4bf','#fbbf24','#fb7185','#34d399','#a78bfa'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="font-semibold text-slate-300 mb-1 capitalize">{label}</p>
      <p className="text-brand-400 font-mono">{Number(payload[0].value).toFixed(2)}</p>
    </div>
  );
};

export function DashboardPage({ onRefresh, notify }) {
  const { 
    inventory, usage, activity, counters, forecasts,
    loading, refreshing, refreshDashboard 
  } = useDashboard();

  const handleRefresh = () => refreshDashboard({ silent: true });

  const criticalAlerts = inventory
    .filter(i => i.status === 'CRITICAL')
    .slice(0, 5);

  const totalUsageData = Object.entries(usage.total_usage || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ 
      name: name.length > 8 ? name.slice(0,8)+'…' : name, 
      value: +value.toFixed(2) 
    }));

  // Pick top ingredient for forecast preview
  const topIngr = totalUsageData[0]?.name || '';
  const topForecast = forecasts.find(f => f.ingredient === topIngr)?.forecast || {};

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Operations Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            <Clock size={14} className="text-brand-400" />
            Daily Stock Lifecycle • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary gap-2 px-4"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Syncing...' : 'Sync Data'}
          </button>
          <button className="btn-primary gap-2">
            <CheckCircle2 size={16} />
            Daily Report
          </button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Today's Purchased" 
          value={counters.todayPurchased.toFixed(1)} 
          suffix="kg/l"
          icon={ShoppingCart} 
          color="brand" 
          trend={12}
        />
        <StatCard 
          label="Today's Usage" 
          value={counters.todayUsed.toFixed(1)} 
          suffix="kg/l"
          icon={Activity} 
          color="teal" 
          trend={-5}
        />
        <StatCard 
          label="Current Stock" 
          value={counters.totalTracked.toFixed(1)} 
          suffix="kg/l"
          icon={Package} 
          color="violet" 
        />
        <StatCard 
          label="Critical Alerts" 
          value={criticalAlerts.length} 
          icon={AlertTriangle} 
          color={criticalAlerts.length > 0 ? 'rose' : 'emerald'} 
        />
      </div>

      {/* ANALYTICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Analytics */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Consumption Trends</h3>
              <p className="text-slate-500 text-xs">Top ingredients used today</p>
            </div>
            <BarChart3 size={20} className="text-slate-600" />
          </div>
          <div className="h-[280px]">
            {totalUsageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totalUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                    {totalUsageData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                <BarChart3 size={40} className="opacity-20" />
                <p className="text-sm">No usage data recorded yet today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Restock Intel / Forecast */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Restock Intelligence</h3>
              <p className="text-slate-500 text-xs">7-day predicted consumption for {topIngr || 'ingredients'}</p>
            </div>
            <TrendingUp size={20} className="text-slate-600" />
          </div>
          <div className="h-[280px]">
            <PredictionChart forecast={topForecast} ingredient={topIngr} />
          </div>
        </div>
      </div>

      {/* OPERATIONS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chef Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <User size={14} className="text-brand-400" />
              Recent Chef Activity
            </h3>
          </div>
          <ActivityFeed items={activity} compact />
        </div>

        {/* Critical Alerts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <AlertTriangle size={14} className="text-accent-rose" />
              Critical Alerts
            </h3>
            {inventory.filter(i => i.status === 'CRITICAL').length > 5 && (
              <button className="text-[10px] font-bold text-brand-400 hover:text-brand-300 uppercase tracking-wider">
                View All
              </button>
            )}
          </div>
          <div className="space-y-3">
            {criticalAlerts.length > 0 ? (
              criticalAlerts.map((item) => (
                <div key={item.ingredient} className="glass-card border-accent-rose/20 bg-accent-rose/5 p-4 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent-rose/50" />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white capitalize">{item.ingredient}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.category} • {item.alert || 'Below threshold'}</p>
                    </div>
                    <span className="badge badge-danger">Critical</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-slate-200">{item.current_stock.toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{item.unit}</span>
                    </div>
                    <button className="btn-ghost py-1 px-2 text-[10px] h-auto">Restock</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 text-slate-500">
                <CheckCircle2 size={32} className="text-accent-emerald/40" />
                <p className="text-xs text-center">All stock levels are currently healthy.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INVENTORY SNAPSHOT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <Package size={14} className="text-accent-teal" />
            Inventory Snapshot
          </h3>
        </div>
        <InventoryTable items={inventory.slice(0, 10)} />
      </div>
    </div>
  );
}
