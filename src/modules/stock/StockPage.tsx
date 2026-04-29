import { useQueryClient } from '@tanstack/react-query';
import { useRestaurantStore } from '../../store/restaurantStore';
import { useLowStock } from '../../hooks/useLowStock';
import { Package, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

export function StockPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const queryClient = useQueryClient();
  const { data: lowStockList, isLoading, isError, isFetching } = useLowStock(restaurantId);

  const items = Array.isArray(lowStockList) ? lowStockList : [];

  if (!restaurantId) {
    return (
      <div className="card card-inner bg-amber-500/10 border-amber-500/30 text-amber-200 text-sm">
        Aucun restaurant sélectionné.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">Stock – Alertes</h2>
        <button
          type="button"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ['menu-low-stock', restaurantId] })
          }
          disabled={isFetching}
          className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 transition-colors"
          title="Rafraîchir"
          aria-label="Rafraîchir les alertes stock"
        >
          <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading ? (
        <div className="card overflow-hidden animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-4 py-4 flex items-center gap-4 border-b border-slate-700">
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-700 rounded w-1/3" />
                <div className="h-2 bg-slate-700 rounded w-full" />
              </div>
              <div className="h-3 bg-slate-700 rounded w-20" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm py-6">
          Erreur lors du chargement des alertes stock (droits propriétaire requis).
        </div>
      ) : items.length === 0 ? (
        <div className="card card-inner flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
          <CheckCircle size={48} className="text-emerald-500/60" />
          <p className="font-medium text-slate-300">Tous les stocks sont OK</p>
          <p className="text-sm text-center">Aucun produit sous le seuil d&apos;alerte.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 text-amber-400">
            <AlertTriangle size={20} />
            <span className="font-medium">
              {items.length} produit(s) en stock faible
            </span>
          </div>
          <ul className="divide-y divide-slate-700/60">
            {(
              items as {
                id: string;
                name: string;
                stock?: number;
                alert_level?: number;
              }[]
            ).map((item) => {
              const stock = item.stock ?? 0;
              const alertLevel = item.alert_level ?? 0;
              const pct = alertLevel > 0 ? Math.min(100, Math.max(0, (stock / alertLevel) * 100)) : 0;
              const severity =
                pct === 0 ? 'bg-red-600' : pct <= 25 ? 'bg-red-500' : pct <= 60 ? 'bg-amber-500' : 'bg-emerald-500';

              return (
                <li key={item.id} className="px-4 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="font-medium text-white truncate">{item.name}</p>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${severity}`}
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                  <div className="text-sm shrink-0 text-right">
                    <span className={stock === 0 ? 'text-red-400 font-semibold' : stock <= alertLevel ? 'text-amber-400 font-medium' : 'text-slate-400'}>
                      {stock}
                    </span>
                    <span className="text-slate-500"> / seuil {alertLevel}</span>
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
