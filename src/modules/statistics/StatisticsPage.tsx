import { useState } from 'react';
import { BarChart3, Star } from 'lucide-react';
import { useRestaurantStore } from '../../store/restaurantStore';
import { useRestaurantStatistics } from '../../hooks/useRestaurantStats';

type Period = 'today' | 'week' | 'month' | 'custom';

interface TopItem {
  id?: string;
  name?: string;
  category?: string;
  total_orders?: number;
  estimated_revenue?: number;
  avg_rating?: number;
}

export function StatisticsPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const [period, setPeriod] = useState<Period>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const customParams =
    period === 'custom'
      ? {
          start_date: startDate ? `${startDate}T00:00:00` : undefined,
          end_date: endDate ? `${endDate}T23:59:59` : undefined,
        }
      : {};

  const { data, isLoading, isError, refetch } = useRestaurantStatistics(restaurantId, {
    period,
    ...customParams,
  });

  const summary = (data as { summary?: Record<string, unknown> } | undefined)?.summary ?? {};
  const customers = (data as { customers?: Record<string, unknown> } | undefined)?.customers ?? {};
  const topItems = (((data as { top_5_items?: TopItem[] } | undefined)?.top_5_items ??
    []) as TopItem[]).slice(0, 10);

  const totalOrders = Number(summary.total_orders ?? 0);
  const totalRevenue = Number(summary.total_revenue ?? 0);
  const averageOrder = Number(summary.average_order_value ?? 0);
  const activeOrders = Number(summary.active_orders ?? 0);

  const uniqueCustomers = Number(customers.unique_customers ?? 0);
  const returningCustomers = Number(customers.returning_customers ?? 0);
  const retentionRate = Number(customers.retention_rate ?? 0);

  if (!restaurantId) {
    return (
      <div className="card card-inner bg-amber-500/10 border-amber-500/30 text-amber-200 text-sm">
        Aucun restaurant sélectionné.
      </div>
    );
  }

  return (
    <div className="space-y-4 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Statistiques</h2>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 text-sm"
          >
            <option value="today">Aujourd&apos;hui</option>
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
            <option value="custom">Période personnalisée</option>
          </select>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm"
          >
            Actualiser
          </button>
        </div>
      </div>

      {period === 'custom' && (
        <div className="card card-inner">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Du</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Au</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm"
            >
              Appliquer
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="card card-inner text-center text-slate-400 py-12">Chargement...</div>
      ) : isError ? (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm py-6">
          Erreur lors du chargement des statistiques.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Commandes totales" value={totalOrders.toLocaleString()} />
            <StatCard label="Revenus totaux" value={`${totalRevenue.toLocaleString()} F`} />
            <StatCard label="Panier moyen" value={`${Math.round(averageOrder).toLocaleString()} F`} />
            <StatCard label="Commandes actives" value={activeOrders.toLocaleString()} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="card card-inner">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Métriques clients</h3>
              <div className="space-y-2 text-sm">
                <MetricRow label="Clients uniques" value={uniqueCustomers.toLocaleString()} />
                <MetricRow label="Clients récurrents" value={returningCustomers.toLocaleString()} />
                <MetricRow label="Taux de rétention" value={`${retentionRate.toFixed(1)}%`} />
              </div>
            </div>

            <div className="card card-inner flex items-center justify-center text-slate-400 min-h-[180px]">
              <div className="inline-flex items-center gap-2">
                <BarChart3 size={20} />
                <span>Graphiques avancés à venir</span>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-600 font-medium text-white">
              Top plats (revenus)
            </div>
            {topItems.length === 0 ? (
              <div className="card-inner text-slate-400 text-center py-10">
                Aucun plat disponible pour cette période.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-800 text-slate-300">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Plat</th>
                      <th className="px-4 py-3">Catégorie</th>
                      <th className="px-4 py-3">Commandes</th>
                      <th className="px-4 py-3">Revenus est.</th>
                      <th className="px-4 py-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200 divide-y divide-slate-700">
                    {topItems.map((item, index) => (
                      <tr key={item.id ?? `${item.name}-${index}`} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-white">{item.name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-400">{item.category ?? '—'}</td>
                        <td className="px-4 py-3">{Number(item.total_orders ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-amber-300">
                          {Number(item.estimated_revenue ?? 0).toLocaleString()} F
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            <Star size={14} />
                            {Number(item.avg_rating ?? 0).toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card-inner">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-semibold text-white mt-1">{value}</p>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 last:border-b-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

