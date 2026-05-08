import { useDashboard } from '../context/DashboardContext';
import { InventoryTable } from '../components/InventoryTable';
import { SkeletonTable }  from '../components/SkeletonCard';
import { EmptyState }     from '../components/EmptyState';
import { Box, RefreshCw, Download } from 'lucide-react';

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
    a.download = `inventory-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor stock levels, restock, and set reorder thresholds inline.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => refreshDashboard({ silent: true })}
            className="btn-secondary"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={exportCsv} className="btn-primary">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : inventory.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No inventory yet"
          message="Submit stock entries to populate inventory."
        />
      ) : (
        <InventoryTable
          items={inventory}
          onUpdate={onUpdate}
          onRestock={onRestock}
        />
      )}
    </div>
  );
}
