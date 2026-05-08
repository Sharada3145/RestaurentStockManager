import React, { useState } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock
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

export function ForecastsPage() {
  const { forecasts, loading, refreshData } = useDashboard();
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  const riskItems = forecasts.filter(f => f.alert);
  const activeIngredient = selectedIngredient || (forecasts.length > 0 ? forecasts[0] : null);

  // Transform forecast data for chart
  const chartData = activeIngredient?.forecast ? Object.entries(activeIngredient.forecast).map(([date, val]) => ({
    date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    usage: val
  })) : [];

  if (loading && forecasts.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Stock Forecasts</h1>
          <p className="text-slate-400 mt-1">AI-driven consumption projections and stockout risk alerts.</p>
        </div>
        <button 
          onClick={refreshData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
        >
          <Clock size={16} />
          <span>Refresh Projections</span>
        </button>
      </header>

      {/* Risk Alerts */}
      {riskItems.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riskItems.map(item => (
            <div key={item.ingredient} className="relative group overflow-hidden rounded-2xl border border-accent-rose/30 bg-accent-rose/5 p-4 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-accent-rose/20 text-accent-rose">
                  <AlertCircle size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-rose bg-accent-rose/10 px-2 py-0.5 rounded-full border border-accent-rose/20">
                  Critical Risk
                </span>
              </div>
              <div className="mt-3">
                <h3 className="font-bold text-white text-lg capitalize">{item.ingredient}</h3>
                <p className="text-sm text-accent-rose/80 mt-1">{item.alert}</p>
              </div>
              <button 
                onClick={() => setSelectedIngredient(item)}
                className="mt-4 w-full py-2 bg-accent-rose/20 hover:bg-accent-rose/30 text-white text-sm font-medium rounded-xl transition-colors border border-accent-rose/20"
              >
                View Analytics
              </button>
            </div>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ingredient List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-slate-800 bg-slate-900/80">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Package size={18} className="text-brand-400" />
                All Ingredients
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              {forecasts.map(item => (
                <button
                  key={item.ingredient}
                  onClick={() => setSelectedIngredient(item)}
                  className={`w-full flex items-center justify-between p-4 transition-all border-b border-slate-800/50 hover:bg-white/5 ${
                    activeIngredient?.ingredient === item.ingredient ? 'bg-brand-500/10 border-l-4 border-l-brand-500' : ''
                  }`}
                >
                  <div className="text-left">
                    <p className={`font-medium capitalize ${activeIngredient?.ingredient === item.ingredient ? 'text-brand-400' : 'text-slate-200'}`}>
                      {item.ingredient}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.current_stock.toFixed(1)} {item.unit} in stock
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    {item.alert ? (
                      <AlertCircle size={16} className="text-accent-rose" />
                    ) : (
                      <TrendingUp size={16} className="text-accent-emerald" />
                    )}
                    <ChevronRight size={14} className="text-slate-600 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {activeIngredient ? (
            <>
              {/* Main Chart */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white capitalize">{activeIngredient.ingredient} Usage Forecast</h3>
                    <p className="text-sm text-slate-400">Projected consumption for the next 7 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Current Stock</p>
                    <p className="text-2xl font-black text-white">
                      {activeIngredient.current_stock.toFixed(2)} <span className="text-sm font-normal text-slate-400">{activeIngredient.unit}</span>
                    </p>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        itemStyle={{ color: '#818cf8' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="usage" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorUsage)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <div className="flex items-center gap-3 text-slate-400 mb-3">
                    <Calendar size={18} />
                    <span className="text-sm font-medium">Weekly Total Forecast</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-white">
                      {Object.values(activeIngredient.forecast).reduce((a, b) => a + b, 0).toFixed(2)}
                    </p>
                    <p className="text-slate-400">{activeIngredient.unit}</p>
                    <span className="ml-auto text-xs text-accent-amber bg-accent-amber/10 px-2 py-1 rounded-lg border border-accent-amber/20 flex items-center gap-1">
                      <ArrowUpRight size={12} />
                      +4.2%
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <div className="flex items-center gap-3 text-slate-400 mb-3">
                    <Clock size={18} />
                    <span className="text-sm font-medium">Estimated Runway</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-3xl font-bold ${activeIngredient.alert ? 'text-accent-rose' : 'text-accent-emerald'}`}>
                      {activeIngredient.alert ? 'Risk' : 'Stable'}
                    </p>
                    <p className="text-slate-400 ml-2">Next 7 Days</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl p-12">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 mb-4">
                  <TrendingUp size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">Select an Ingredient</h3>
                <p className="text-slate-400 mt-2">Click an item on the left to see its detailed usage forecast.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
