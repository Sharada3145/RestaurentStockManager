import { useDashboard } from '../context/DashboardContext';
import { InventoryTable } from '../components/InventoryTable';
import { SkeletonTable }  from '../components/SkeletonCard';
import { EmptyState }     from '../components/EmptyState';
import { Box, RefreshCw, Download, Search, Filter, Layers, FileSpreadsheet, Activity } from 'lucide-react';

function toCsv(rows) {
  return rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export function InventoryPage({ onUpdate, onRestock }) {
  const { inventory, loading, refreshDashboard } = useDashboard();

  const exportCsv = () => {
    const csv = toCsv([
      ['Ingredient', 'Category', 'Stock', 'Unit', 'Reorder Threshold', 'Alert'],
      ...inventory.map((i) => [
        i.ingredient,
        i.category,
        i.current_stock,
        i.unit,
        i.reorder_threshold,
        i.alert || '',
      ]),
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `stock-audit-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-16 pb-24">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 rounded-[32px] bg-white border border-luxury-border flex items-center justify-center text-luxury-gold shadow-premium">
            <Layers size={40} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <span className="text-[11px] font-black text-luxury-gold uppercase tracking-[0.3em]">Module: Assets</span>
               <div className="h-px w-8 bg-luxury-gold/30" />
            </div>
            <h1 className="text-5xl font-black text-luxury-text-primary tracking-tight">Master Inventory</h1>
            <p className="text-luxury-text-muted text-sm font-medium italic">
              Live ledger management, restock calibration, and high-fidelity operational audits.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <button
            onClick={() => refreshDashboard({ silent: true })}
            className="btn-secondary h-16 px-8 shadow-sm"
          >
            <RefreshCw size={20} className="text-luxury-gold" />
            <span className="font-black uppercase tracking-widest text-[11px]">Sync Ledger</span>
          </button>
          
          <button onClick={exportCsv} className="btn-primary h-16 px-10 shadow-gold-lg gap-4">
            <FileSpreadsheet size={22} />
            <span className="font-black uppercase tracking-widest text-[11px]">Export Audit Protocol</span>
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="space-y-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 px-6 py-5 rounded-3xl bg-white/60 border border-luxury-border shadow-premium">
           <div className="flex items-center gap-10">
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-status-success shadow-sm" />
                 <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">Asset Stable</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-status-warning shadow-sm" />
                 <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">Low Velocity</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-status-danger animate-pulse shadow-sm" />
                 <span className="text-[10px] font-black text-luxury-text-muted uppercase tracking-[0.2em]">Critical Restock</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-luxury-gold/30 rounded-full" />
              <p className="text-[11px] font-black text-luxury-text-primary uppercase tracking-[0.3em]">Auditing {inventory.length} Total Commodities</p>
           </div>
        </div>

        {loading ? (
          <div className="space-y-6">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 w-full rounded-[28px] bg-white border border-luxury-border animate-pulse shadow-sm" />
             ))}
          </div>
        ) : inventory.length === 0 ? (
          <EmptyState
            icon={Box}
            title="Operational Ledger Empty"
            message="No registered assets detected in the current shift. Initiate a stock intake stream to populate the catalog."
            theme="warm"
          />
        ) : (
          <InventoryTable
            items={inventory}
            onUpdate={onUpdate}
            onRestock={onRestock}
            theme="warm"
          />
        )}
      </div>
    </div>
  );
}
