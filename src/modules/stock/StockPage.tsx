import { useRestaurantStore } from '../../store/restaurantStore';
import { useLowStock } from '../../hooks/useLowStock';
import type { LowStockItem } from '../../types';
import { Package, AlertTriangle } from 'lucide-react';

export function StockPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const { data: lowStockList, isLoading, isError } = useLowStock(restaurantId);

  const items: LowStockItem[] = Array.isArray(lowStockList) ? (lowStockList as LowStockItem[]) : [];

  if (!restaurantId) {
    return (
      <div className="card card-inner bg-amber-500/10 border-amber-500/30 text-amber-200 text-sm">
        Aucun restaurant sélectionné.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Stock – Alertes</h2>

      {isLoading ? (
        <div className="card card-inner text-center text-slate-400 py-12">Chargement...</div>
      ) : isError ? (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm py-6">
          Erreur lors du chargement des alertes stock (droits propriétaire requis).
        </div>
      ) : items.length === 0 ? (
        <div className="card card-inner flex flex-col items-center justify-center gap-2 text-slate-400 py-12">
          <Package size={40} />
          <p>Aucune alerte stock faible</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-600 flex items-center gap-2 text-amber-400">
            <AlertTriangle size={20} />
            <span className="font-medium">Produits en stock faible</span>
          </div>
          <ul className="divide-y divide-slate-700">
            {items.map((item) => {
              const stock = item.stock ?? 0;
              const alertLevel = item.alert_level ?? 0;
              const pct = alertLevel > 0 ? Math.min(100, (stock / alertLevel) * 100) : 0;
              return (
                <li key={item.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{item.name}</p>
                    <div className="mt-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct <= 25 ? 'bg-red-500' : pct <= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-slate-400 shrink-0">
                    <span className={stock <= alertLevel ? 'text-red-400 font-medium' : ''}>
                      {stock} / seuil {alertLevel}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}