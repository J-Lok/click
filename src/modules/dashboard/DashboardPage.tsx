import { LayoutDashboard } from 'lucide-react';
import { useRestaurantStore } from '../../store/restaurantStore';
import { useRestaurantStatistics } from '../../hooks/useRestaurantStats';
import { usePendingOrders } from '../../hooks/useRestaurantOrders';

export function DashboardPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const { data: stats, isLoading: statsLoading } = useRestaurantStatistics(restaurantId, {
    period: 'today',
  });
  const { data: pendingOrders, isLoading: ordersLoading } = usePendingOrders(restaurantId);

  const summary = stats?.summary;
  const ca = summary?.total_revenue ?? 0;
  const totalOrders = summary?.total_orders ?? 0;
  const completed = summary?.completed_orders ?? 0;
  const cancelled = summary?.cancelled_orders ?? 0;
  const activeOrders = totalOrders - completed - cancelled;

  const widgets = [
    { label: "CA aujourd'hui", value: `${ca.toLocaleString()} FCFA`, color: 'bg-emerald-500/20 text-emerald-400' },
    { label: 'Commandes', value: String(totalOrders), color: 'bg-blue-500/20 text-blue-400' },
    { label: 'En cours', value: String(activeOrders), color: 'bg-amber-500/20 text-amber-400' },
    { label: 'Alertes stock', value: '0', color: 'bg-red-500/20 text-red-400' },
  ];

  const loading = statsLoading || ordersLoading;
  const hasData = !!restaurantId && !!stats;

  return (
    <div className="space-y-6 text-slate-100">
      {!restaurantId && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/20 p-4 text-amber-200 text-sm">
          Aucun restaurant associé à votre compte. Créez un restaurant ou contactez l&apos;administrateur.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((w) => (
          <div key={w.label} className="card card-inner">
            <p className="text-sm text-slate-400">{w.label}</p>
            <p className={`text-2xl font-bold mt-1 ${w.color}`}>
              {loading && hasData ? '...' : w.value}
            </p>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-inner flex items-center justify-center gap-2 text-slate-400 h-48">
          <LayoutDashboard size={32} className="text-slate-500" />
          <span>Graphique des ventes (24h) – connecté aux statistiques API</span>
        </div>
      </div>
      <div className="card">
        <h2 className="px-4 py-3 border-b border-slate-600 font-medium text-white">Commandes en attente</h2>
        <div className="card-inner">
          {ordersLoading ? (
            <p className="text-slate-400 text-center py-8">Chargement...</p>
          ) : pendingOrders && pendingOrders.length > 0 ? (
            <ul className="space-y-2 text-slate-200">
              {pendingOrders.slice(0, 5).map((o: { id: string; total_amount?: number; user_name?: string }) => (
                <li key={o.id} className="flex justify-between text-sm">
                  <span>{o.user_name ?? o.id}</span>
                  <span>{o.total_amount?.toLocaleString() ?? 0} FCFA</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-center py-8">Aucune commande en attente</p>
          )}
        </div>
      </div>
    </div>
  );
}
