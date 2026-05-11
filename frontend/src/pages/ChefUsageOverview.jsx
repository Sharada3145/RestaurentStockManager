import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Package, Clock, Filter, Search, Calendar,
  TrendingDown, AlertCircle, ChevronDown, ChevronUp,
  History, UserCheck, Utensils
} from 'lucide-react';
import { getChefUsageDetailed } from '../services/api';

export function ChefUsageOverview() {
  const [data, setData] = useState({ summary: {}, chefs: [] });
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(1);
  const [searchChef, setSearchChef] = useState('');
  const [searchItem, setSearchItem] = useState('');
  const [expandedChefs, setExpandedChefs] = useState({});

  useEffect(() => {
    fetchData();
  }, [days]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await getChefUsageDetailed(days);
      setData(res);
      // Auto-expand the first chef if available
      if (res.chefs.length > 0) {
        setExpandedChefs({ [res.chefs[0].chef_name]: true });
      }
    } catch (err) {
      console.error("Failed to fetch chef usage:", err);
    } finally {
      setLoading(false);
    }
  }

  const toggleChef = (name) => {
    setExpandedChefs(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const filteredChefs = useMemo(() => {
    return data.chefs.filter(chef => {
      const matchesChef = chef.chef_name.toLowerCase().includes(searchChef.toLowerCase());
      const matchesItem = searchItem === '' || chef.items.some(item => 
        item.ingredient.toLowerCase().includes(searchItem.toLowerCase())
      );
      return matchesChef && matchesItem;
    });
  }, [data.chefs, searchChef, searchItem]);

  const summary = data.summary || {};

  if (loading && !data.chefs.length) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-luxury-border" />)}
        </div>
        <div className="space-y-4">
           {[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-3xl border border-luxury-border" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Page Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-luxury-text-primary tracking-tight">Chef Usage Overview</h1>
          <p className="text-luxury-text-muted text-sm font-medium">Detailed tracking of individual kitchen usage and accountability.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Date Filter */}
          <div className="flex items-center bg-white border border-luxury-border rounded-xl p-1 shadow-sm">
            {[
              { label: 'Today', val: 1 },
              { label: 'Yesterday', val: 2 },
              { label: 'Last 7 Days', val: 7 }
            ].map(opt => (
              <button
                key={opt.val}
                onClick={() => setDays(opt.val)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                  days === opt.val 
                  ? 'bg-luxury-gold text-white shadow-md' 
                  : 'text-luxury-text-muted hover:bg-luxury-cream'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-text-muted group-focus-within:text-luxury-gold transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Filter by chef..."
              value={searchChef}
              onChange={e => setSearchChef(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border border-luxury-border rounded-xl text-xs font-bold w-48 focus:border-luxury-gold outline-none shadow-sm transition-all"
            />
          </div>

          <div className="relative group">
            <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-text-muted group-focus-within:text-luxury-gold transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Filter by item..."
              value={searchItem}
              onChange={e => setSearchItem(e.target.value)}
              className="pl-10 pr-4 py-3 bg-white border border-luxury-border rounded-xl text-xs font-bold w-48 focus:border-luxury-gold outline-none shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Simple Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Chefs', val: summary.active_chefs || 0, icon: UserCheck, color: 'text-luxury-gold' },
          { label: 'Items Used', val: summary.total_items_used || 0, icon: Package, color: 'text-luxury-olive' },
          { label: 'Total Qty', val: `${summary.total_quantity_used || 0} kg/l`, icon: TrendingDown, color: 'text-luxury-terracotta' },
          { label: 'Affected Alerts', val: summary.low_stock_affected || 0, icon: AlertCircle, color: summary.low_stock_affected > 0 ? 'text-luxury-burgundy' : 'text-status-success' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white border border-luxury-border p-6 rounded-2xl flex items-center gap-5 shadow-sm">
            <div className={`w-12 h-12 rounded-xl bg-luxury-cream flex items-center justify-center ${item.color}`}>
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">{item.label}</p>
              <p className="text-2xl font-black text-luxury-text-primary tabular-nums">{item.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chef-wise list section */}
      <div className="space-y-6">
        {filteredChefs.length === 0 ? (
          <div className="bg-white border border-dashed border-luxury-border p-20 rounded-3xl flex flex-col items-center justify-center gap-4 text-center">
             <Utensils size={48} className="text-luxury-text-muted/20" />
             <p className="text-sm font-bold text-luxury-text-muted uppercase tracking-widest">No usage activity found matching filters</p>
          </div>
        ) : (
          filteredChefs.map((chef, idx) => {
            const isExpanded = expandedChefs[chef.chef_name];
            
            return (
              <motion.div 
                key={chef.chef_name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-luxury-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Chef Card Header */}
                <div 
                  onClick={() => toggleChef(chef.chef_name)}
                  className="p-8 flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-luxury-cream border border-luxury-gold/10 flex items-center justify-center text-luxury-gold group-hover:bg-luxury-gold group-hover:text-white transition-all">
                      <User size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-luxury-text-primary capitalize tracking-tight">{chef.chef_name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                          chef.status === 'Active' ? 'bg-status-success/10 text-status-success' : 'bg-luxury-text-muted/10 text-luxury-text-muted'
                        }`}>
                          {chef.status}
                        </span>
                        <span className="text-[10px] font-bold text-luxury-text-muted">
                          Last activity: {chef.last_activity}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12 text-right mr-4">
                    <div>
                      <p className="text-lg font-black text-luxury-text-primary tabular-nums">{chef.total_quantity_used}</p>
                      <p className="text-[9px] font-black text-luxury-text-muted uppercase tracking-widest">Total kg/l</p>
                    </div>
                    <div>
                      <p className="text-lg font-black text-luxury-text-primary tabular-nums">{chef.items_count}</p>
                      <p className="text-[9px] font-black text-luxury-text-muted uppercase tracking-widest">Items Used</p>
                    </div>
                    <div className="text-luxury-text-muted group-hover:text-luxury-gold transition-colors">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Table Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-luxury-border"
                    >
                      <div className="p-8 bg-luxury-cream/30">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-luxury-border">
                              <th className="pb-4 text-[10px] font-black text-luxury-text-muted uppercase tracking-widest">Grocery Item</th>
                              <th className="pb-4 text-[10px] font-black text-luxury-text-muted uppercase tracking-widest text-center">Qty Used</th>
                              <th className="pb-4 text-[10px] font-black text-luxury-text-muted uppercase tracking-widest text-center">Unit</th>
                              <th className="pb-4 text-[10px] font-black text-luxury-text-muted uppercase tracking-widest text-center">Time</th>
                              <th className="pb-4 text-[10px] font-black text-luxury-text-muted uppercase tracking-widest text-right">Remaining Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-luxury-border/50">
                            {chef.items.map((item, i) => (
                              <tr key={i} className="group/row hover:bg-white/50 transition-colors">
                                <td className="py-4 text-xs font-bold text-luxury-text-primary capitalize flex items-center gap-3">
                                   <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold/40" />
                                   {item.ingredient}
                                </td>
                                <td className="py-4 text-xs font-black text-luxury-text-primary text-center tabular-nums">
                                  {item.quantity_used.toFixed(1)}
                                </td>
                                <td className="py-4 text-[10px] font-bold text-luxury-text-muted text-center uppercase tracking-tighter">
                                  {item.unit}
                                </td>
                                <td className="py-4 text-xs font-medium text-luxury-text-muted text-center italic">
                                  {item.time}
                                </td>
                                <td className="py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                     <span className={`text-xs font-black tabular-nums ${item.remaining_stock === 0 ? 'text-luxury-burgundy' : 'text-luxury-text-primary'}`}>
                                       {item.remaining_stock.toFixed(1)}
                                     </span>
                                     <span className="text-[9px] font-bold text-luxury-text-muted uppercase">{item.unit}</span>
                                     {item.remaining_stock === 0 && <AlertCircle size={10} className="text-luxury-burgundy" />}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
