import { motion } from 'framer-motion';
import { 
  Activity, AlertTriangle, BarChart3, Box, RefreshCw, 
  TrendingUp, Package, ShoppingCart, User, Clock, CheckCircle2,
  ChevronRight, Utensils, Zap, ArrowUpRight, ArrowDownRight,
  Sparkles, Coffee
} from 'lucide-react';
import { 
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, 
  Tooltip, XAxis, YAxis, Area, AreaChart
} from 'recharts';
import { ActivityFeed } from '../components/ActivityFeed';
import { StatCard } from '../components/StatCard';
import { InventoryTable } from '../components/InventoryTable';
import { PredictionChart } from '../components/PredictionChart';
import { useDashboard } from '../context/DashboardContext';

const COLORS = ['#C9A227', '#C97A40', '#6B8E23', '#7A1F3D', '#10B981', '#3B82F6'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel px-5 py-4 border-luxury-gold/20 shadow-gold bg-white/95">
      <p className="text-[10px] font-black text-luxury-gold uppercase tracking-[0.2em] mb-2">{label}</p>
      <div className="flex items-baseline gap-3">
         <span className="text-xl font-black text-luxury-text-primary">{Number(payload[0].value).toFixed(2)}</span>
         <span className="text-[10px] text-luxury-text-muted uppercase font-bold">kg/l</span>
      </div>
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

  const topIngr = totalUsageData[0]?.name || '';
  const topForecast = forecasts.find(f => f.ingredient === topIngr)?.forecast || {};

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute -inset-4 bg-luxury-gradient rounded-[40px] blur-3xl opacity-5"></div>
        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-12 glass-panel p-12 overflow-hidden border-luxury-gold/10">
          <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none rotate-6">
            <Utensils size={280} className="text-luxury-gold" />
          </div>
          
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-luxury-gold/10 border border-luxury-gold/20">
              <Sparkles size={14} className="text-luxury-gold" />
              <span className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.2em]">Operational Excellence</span>
            </div>
            <div className="space-y-4">
               <h1 className="text-5xl md:text-6xl font-black text-luxury-text-primary tracking-tighter leading-[0.95]">
                 Today's Kitchen <br />
                 <span className="gradient-text">Operations</span>
               </h1>
               <p className="max-w-2xl text-luxury-text-secondary text-base md:text-lg font-medium leading-relaxed">
                 Welcome back, Chef. Your real-time intelligence console is calibrated for today's service. 
                 Monitor stock velocity, track consumption, and ensure seamless hospitality performance.
               </p>
            </div>
            
            <div className="flex items-center gap-5 pt-2">
               <div className="flex -space-x-3">
                  {[1,2,3].map(i => (
                     <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-luxury-cream flex items-center justify-center text-luxury-gold shadow-sm">
                        <User size={16} />
                     </div>
                  ))}
               </div>
               <p className="text-xs font-bold text-luxury-text-muted">
                  <span className="text-luxury-text-primary font-black">4 Chefs</span> currently logging activity
               </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-10">
             <button
               onClick={handleRefresh}
               disabled={refreshing}
               className="btn-secondary h-16 px-8 min-w-[200px]"
             >
               <RefreshCw size={20} className={`text-luxury-gold ${refreshing ? 'animate-spin' : ''}`} />
               <span className="font-bold">{refreshing ? 'Synchronizing...' : 'Refresh Intelligence'}</span>
             </button>
             <button className="btn-primary h-16 px-10 group shadow-gold-lg">
               <span className="font-bold tracking-widest uppercase text-xs">Operational Report</span>
               <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform ml-2" />
             </button>
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          label="Purchased Today" 
          value={counters.todayPurchased.toFixed(1)} 
          suffix="kg/l"
          icon={ShoppingCart} 
          color="gold" 
          trend={{ value: 12.4, positive: true }}
        />
        <StatCard 
          label="Usage Volume" 
          value={counters.todayUsed.toFixed(1)} 
          suffix="kg/l"
          icon={Utensils} 
          color="terracotta" 
          trend={{ value: 4.8, positive: false }}
        />
        <StatCard 
          label="Master Inventory" 
          value={counters.totalTracked.toFixed(1)} 
          suffix="kg/l"
          icon={Package} 
          color="olive" 
        />
        <StatCard 
          label="Priority Alerts" 
          value={criticalAlerts.length} 
          icon={AlertTriangle} 
          color={criticalAlerts.length > 0 ? 'burgundy' : 'emerald'} 
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Consumption Intelligence */}
        <div className="glass-panel p-10 border-luxury-gold/5">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-luxury-text-primary tracking-tight">Stock Velocity</h3>
              <p className="text-luxury-text-muted text-sm font-medium">Daily usage distribution by ingredient category</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-luxury-gold/5 border border-luxury-gold/10 flex items-center justify-center text-luxury-gold">
              <BarChart3 size={24} />
            </div>
          </div>
          
          <div className="h-[360px]">
            {totalUsageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totalUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,42,38,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={15}
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,162,39,0.03)' }} />
                  <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={40}>
                    {totalUsageData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-luxury-text-muted/30 gap-6">
                <div className="w-20 h-20 rounded-[32px] bg-luxury-gold/5 border border-luxury-gold/10 flex items-center justify-center">
                  <BarChart3 size={40} />
                </div>
                <p className="text-base font-bold uppercase tracking-widest">No activity data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Prediction Trends */}
        <div className="glass-panel p-10 border-luxury-gold/5">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-luxury-text-primary tracking-tight">Demand Forecast</h3>
              <p className="text-luxury-text-muted text-sm font-medium">7-day predictive usage model for {topIngr || 'Master Stock'}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-luxury-gold/5 border border-luxury-gold/10 flex items-center justify-center text-luxury-gold">
              <TrendingUp size={24} />
            </div>
          </div>
          
          <div className="h-[360px]">
            <PredictionChart forecast={topForecast} ingredient={topIngr} premium warm />
          </div>
        </div>
      </div>

      {/* Operational Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-luxury-gold/10 flex items-center justify-center text-luxury-gold shadow-sm">
                  <Activity size={18} />
               </div>
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-luxury-text-primary">
                 Chef Intelligence Feed
               </h3>
            </div>
            <button className="text-[11px] font-black text-luxury-gold hover:text-luxury-terracotta transition-colors uppercase tracking-widest flex items-center gap-2">
               Audit Full Logs <ChevronRight size={14} />
            </button>
          </div>
          <ActivityFeed items={activity} compact theme="warm" />
        </div>

        {/* Low Stock Alerts */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-status-danger/10 flex items-center justify-center text-status-danger shadow-sm">
                  <AlertTriangle size={18} />
               </div>
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-luxury-text-primary">
                 Priority Alerts
               </h3>
            </div>
            <span className="badge-danger px-4 py-1.5 shadow-sm">
               {inventory.filter(i => i.status === 'CRITICAL').length} CRITICAL
            </span>
          </div>
          
          <div className="space-y-5">
            {criticalAlerts.length > 0 ? (
              criticalAlerts.map((item) => (
                <div key={item.ingredient} className="glass-panel p-8 border-status-danger/10 bg-status-danger/[0.02] group relative overflow-hidden hover:bg-status-danger/[0.04]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-status-danger/[0.03] blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-status-danger/[0.05] transition-colors" />
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-1">
                      <p className="text-lg font-black text-luxury-text-primary capitalize leading-none tracking-tight">{item.ingredient}</p>
                      <p className="text-[10px] text-luxury-text-muted font-bold uppercase tracking-widest">{item.category} • Immediate Reorder</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-status-danger/10 flex items-center justify-center text-status-danger shadow-sm">
                       <Coffee size={18} />
                    </div>
                  </div>

                  <div className="mt-8 flex items-end justify-between relative z-10">
                    <div className="space-y-2">
                       <p className="text-[10px] text-luxury-text-muted font-bold uppercase tracking-widest">Available Stock</p>
                       <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-luxury-text-primary leading-none tabular-nums">{item.current_stock.toFixed(1)}</span>
                          <span className="text-xs font-black text-luxury-text-muted uppercase">{item.unit}</span>
                       </div>
                    </div>
                    <button className="btn-primary py-2.5 px-6 text-[10px] h-auto uppercase tracking-[0.2em] font-black bg-status-danger hover:bg-status-danger/90 shadow-lg">
                       Restock
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel p-12 flex flex-col items-center justify-center gap-6 text-luxury-text-muted/40 text-center border-luxury-gold/5">
                <div className="w-20 h-20 rounded-[32px] bg-status-success/10 flex items-center justify-center text-status-success shadow-lg">
                   <CheckCircle2 size={40} />
                </div>
                <div className="space-y-1">
                   <p className="text-sm font-black uppercase tracking-widest text-luxury-text-primary">Inventory Stable</p>
                   <p className="text-[10px] font-bold uppercase tracking-tighter">No critical reorders detected</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Snapshot */}
      <div className="space-y-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="w-14 h-14 rounded-2xl bg-status-success/5 border border-status-success/10 flex items-center justify-center text-status-success">
                <Box size={24} />
             </div>
             <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-status-success">Intelligence Audit</h3>
                <h2 className="text-3xl font-black text-luxury-text-primary tracking-tight">Stock Snapshot</h2>
             </div>
          </div>
          <button className="btn-secondary h-14 px-8 border-luxury-gold/20 text-luxury-gold hover:bg-luxury-gold/5">
             <span className="font-bold tracking-widest uppercase text-xs">Manage Master Inventory</span>
          </button>
        </div>
        <div className="p-1 rounded-[40px] bg-white shadow-premium">
           <InventoryTable items={inventory.slice(0, 10)} theme="warm" />
        </div>
      </div>
    </div>
  );
}
