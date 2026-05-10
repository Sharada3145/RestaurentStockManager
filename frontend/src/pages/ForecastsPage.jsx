import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw,
  Target,
  Zap,
  BarChart4,
  Sparkles,
  Coffee
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { useDashboard } from '../context/DashboardContext';

const CustomTooltip = ({ active, payload, label }) => {
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
};

export function ForecastsPage() {
  const { forecasts, loading, refreshDashboard } = useDashboard();
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const riskItems = forecasts.filter(f => f.alert);
  const activeIngredient = selectedIngredient || (forecasts.length > 0 ? forecasts[0] : null);

  const chartData = activeIngredient?.forecast ? Object.entries(activeIngredient.forecast).map(([date, val]) => ({
    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    usage: val
  })) : [];

  if (loading && forecasts.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
         <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-luxury-gold/10 border-t-luxury-gold animate-spin shadow-gold" />
            <div className="absolute inset-0 flex items-center justify-center">
               <Zap size={24} className="text-luxury-gold animate-pulse" />
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
           <div className="w-20 h-20 rounded-[32px] bg-white border border-luxury-border flex items-center justify-center text-luxury-gold shadow-premium">
              <TrendingUp size={40} />
           </div>
           <div className="space-y-2">
              <div className="flex items-center gap-3">
                 <span className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.3em]">Operational Module</span>
                 <div className="h-px w-8 bg-luxury-gold/30" />
              </div>
              <h1 className="text-5xl font-black text-luxury-text-primary tracking-tight">Usage Predictions</h1>
              <p className="text-luxury-text-muted text-sm font-medium italic">Predictive consumption modeling and automated stockout risk analysis.</p>
           </div>
        </div>
        <button 
          onClick={() => refreshDashboard({ silent: true })}
          className="btn-secondary h-16 px-10 shadow-sm"
        >
          <RefreshCw size={20} className="text-luxury-gold" />
          <span className="font-black uppercase tracking-widest text-[11px]">Calibrate Projections</span>
        </button>
      </header>

      {/* Risk Alerts */}
      {riskItems.length > 0 && (
        <section className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-status-danger animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              <h3 className="text-xs font-black text-status-danger uppercase tracking-[0.4em]">Critical Operations Alerts</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             {riskItems.map(item => (
               <div key={item.ingredient} className="glass-panel p-8 border-status-danger/10 bg-status-danger/[0.02] group relative overflow-hidden transition-all hover:bg-status-danger/[0.04]">
                 <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:opacity-[0.08] transition-opacity rotate-12 pointer-events-none">
                    <AlertCircle size={100} className="text-status-danger" />
                 </div>
                 <div className="flex items-start justify-between relative z-10">
                   <div className="w-12 h-12 rounded-[18px] bg-status-danger/10 text-status-danger flex items-center justify-center shadow-sm">
                     <AlertCircle size={24} />
                   </div>
                   <span className="badge-danger px-4 py-1.5 shadow-sm">Runway Alert</span>
                 </div>
                 <div className="mt-8 relative z-10">
                   <h3 className="text-2xl font-black text-luxury-text-primary capitalize tracking-tight">{item.ingredient}</h3>
                   <p className="text-[10px] text-luxury-text-muted font-black uppercase tracking-[0.2em] mt-2">Projection: <span className="text-status-danger">Stockout within 48h</span></p>
                 </div>
                 <button 
                   onClick={() => setSelectedIngredient(item)}
                   className="mt-8 w-full h-14 bg-status-danger/10 hover:bg-status-danger/20 text-status-danger text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all border border-status-danger/20 shadow-sm"
                 >
                   Priority Audit
                 </button>
               </div>
             ))}
           </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Ingredient Queue */}
        <div className="xl:col-span-4 space-y-8">
          <div className="glass-panel overflow-hidden border-luxury-gold/5 bg-white/60 shadow-premium">
            <div className="p-8 border-b border-luxury-border bg-white/80">
              <h2 className="text-xs font-black text-luxury-text-primary uppercase tracking-[0.3em] flex items-center gap-4">
                <Target size={18} className="text-luxury-gold" />
                Intelligence Queue
              </h2>
            </div>
            <div className="max-h-[720px] overflow-y-auto custom-scrollbar">
              {forecasts.map(item => (
                <button
                  key={item.ingredient}
                  onClick={() => setSelectedIngredient(item)}
                  className={`w-full flex items-center justify-between px-8 py-7 transition-all border-b border-luxury-border/30 hover:bg-luxury-gold/[0.03] relative group ${
                    activeIngredient?.ingredient === item.ingredient ? 'bg-luxury-gold/[0.05]' : ''
                  }`}
                >
                  {activeIngredient?.ingredient === item.ingredient && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-luxury-gold shadow-gold" />
                  )}
                  <div className="text-left space-y-1">
                    <p className={`text-lg font-black capitalize tracking-tight ${activeIngredient?.ingredient === item.ingredient ? 'text-luxury-gold' : 'text-luxury-text-primary group-hover:text-luxury-gold'}`}>
                      {item.ingredient}
                    </p>
                    <p className="text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest">
                      {item.current_stock.toFixed(1)} {item.unit} in ledger
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    {item.alert ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-status-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-status-success shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    )}
                    <ChevronRight size={18} className={`transition-colors ${activeIngredient?.ingredient === item.ingredient ? 'text-luxury-gold' : 'text-luxury-border group-hover:text-luxury-gold'}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Intelligence Detail */}
        <div className="xl:col-span-8 space-y-10">
          {activeIngredient ? (
            <>
              {/* Consumption Model Chart */}
              <div className="glass-panel p-12 relative overflow-hidden group border-luxury-gold/5 bg-white/70 shadow-premium">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity rotate-6">
                   <BarChart4 size={240} className="text-luxury-gold" />
                </div>
                
                <div className="flex items-center justify-between mb-16 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <Sparkles size={16} className="text-luxury-gold" />
                       <span className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.3em]">Neural Forecast</span>
                    </div>
                    <h3 className="text-4xl font-black text-luxury-text-primary capitalize tracking-tighter">{activeIngredient.ingredient} Model</h3>
                    <p className="text-sm font-medium text-luxury-text-muted">7-day projected kitchen consumption based on historical velocity</p>
                  </div>
                  <div className="text-right space-y-2 bg-white/60 p-6 rounded-3xl border border-luxury-border shadow-sm">
                    <p className="text-[10px] text-luxury-gold font-black uppercase tracking-[0.2em]">Verified Inventory</p>
                    <p className="text-5xl font-black text-luxury-text-primary tabular-nums tracking-tighter">
                      {activeIngredient.current_stock.toFixed(1)} <span className="text-xs font-black text-luxury-text-muted uppercase tracking-widest ml-1">{activeIngredient.unit}</span>
                    </p>
                  </div>
                </div>

                <div className="h-[420px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="luxuryChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9A227" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#C9A227" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,42,38,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 800 }} 
                        dy={20}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 800 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="usage" 
                        stroke="#C9A227" 
                        strokeWidth={5}
                        fillOpacity={1} 
                        fill="url(#luxuryChartGrad)" 
                        animationDuration={2500}
                        activeDot={{ r: 10, fill: '#C9A227', stroke: '#fff', strokeWidth: 4, shadow: '0 10px 20px rgba(201,162,39,0.3)' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Advanced Analytics Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="glass-panel p-10 group bg-white/80 border-luxury-gold/5 shadow-premium">
                  <div className="flex items-center gap-5 text-luxury-text-muted mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-luxury-gold/5 border border-luxury-gold/10 flex items-center justify-center text-luxury-gold group-hover:bg-luxury-gold/10 transition-all shadow-sm">
                       <Calendar size={20} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] tracking-widest">Aggregate Weekly Demand</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-4">
                       <p className="text-5xl font-black text-luxury-text-primary tracking-tighter tabular-nums">
                         {Object.values(activeIngredient.forecast).reduce((a, b) => a + b, 0).toFixed(1)}
                       </p>
                       <p className="text-sm font-black text-luxury-text-muted uppercase tracking-widest">{activeIngredient.unit}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-luxury-gold/10 border border-luxury-gold/20 text-luxury-gold shadow-sm">
                      <ArrowUpRight size={16} />
                      <span className="text-[11px] font-black uppercase tracking-widest">STABLE</span>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-10 group bg-white/80 border-luxury-gold/5 shadow-premium">
                  <div className="flex items-center gap-5 text-luxury-text-muted mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-luxury-terracotta/5 border border-luxury-terracotta/10 flex items-center justify-center text-luxury-terracotta group-hover:bg-luxury-terracotta/10 transition-all shadow-sm">
                       <Clock size={20} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] tracking-widest">Intelligence Confidence</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-4">
                       <p className={`text-5xl font-black tracking-tighter ${activeIngredient.alert ? 'text-status-danger' : 'text-status-success'}`}>
                         {activeIngredient.alert ? 'Alert' : 'Optimal'}
                       </p>
                       <p className="text-[11px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">P: 0.94</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border-4 border-luxury-cream border-t-luxury-gold animate-spin" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[600px] items-center justify-center border-4 border-dashed border-luxury-border rounded-[40px] p-20 bg-white/20">
              <div className="text-center space-y-10">
                <div className="mx-auto w-32 h-32 bg-white border border-luxury-border rounded-[48px] flex items-center justify-center text-luxury-gold shadow-premium animate-float">
                  <Coffee size={56} />
                </div>
                <div className="space-y-4">
                   <h3 className="text-3xl font-black text-luxury-text-primary tracking-tight">Intelligence Ready</h3>
                   <p className="text-luxury-text-muted font-medium max-w-sm mx-auto leading-relaxed">Select an operational ingredient from the predictive queue to initiate deep neural analysis and consumption forecasting.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
