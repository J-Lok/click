import { useState } from 'react';
import { BarChart3, Star, RefreshCw } from 'lucide-react';
import { useRestaurantStore } from '../../store/restaurantStore';
import { useRestaurantStatistics } from '../../hooks/useRestaurantStats';
import { getApiErrorMessage } from '../../lib/apiError';

type Period = 'day' | 'week' | 'month' | 'year' | 'custom';

interface TopItem {
  id?: string;
  name?: string;
  category?: string;
  quantity_sold?: number;   // API field name
  revenue?: number;         // API field name
  avg_rating?: number;
  price?: number;
}

const PERIOD_LABELS: Record<Period, string> = {
  day: "Aujourd'hui",
  week: 'Semaine',
  month: 'Mois',
  year: 'Année',
  custom: 'Personnalisé',
};

function StatCardSkeleton() {
  return (
    <div className="card card-inner animate-pulse space-y-2">
      <div className="h-3 bg-slate-700 rounded w-1/2" />
      <div className="h-8 bg-slate-700 rounded w-3/4" />
    </div>
  );
}

export function StatisticsPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const [period, setPeriod] = useState<Period>('day');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);

  const customParams =
    period === 'custom'
      ? {
          start_date: startDate ? `${startDate}T00:00:00` : undefined,
          end_date: endDate ? `${endDate}T23:59:59` : undefined,
        }
      : {};

  const { data, isLoading, isError, error, refetch, isFetching } = useRestaurantStatistics(
    restaurantId,
    { period, ...customParams }
  );

  const summary = (data as { summary?: Record<string, unknown> } | undefined)?.summary ?? {};
  // API returns customer_stats, not customers
  const customerStats =
    (data as { customer_stats?: Record<string, unknown> } | undefined)?.customer_stats ?? {};
  // API returns top_items, not top_5_items
  const topItems = (
    (data as { top_items?: TopItem[] } | undefined)?.top_items ?? []
  ).slice(0, 10);

  const totalOrders = Number(summary.total_orders ?? 0);
  const totalRevenue = Number(summary.total_revenue ?? 0);
  // API uses avg_order_value (not average_order_value)
  const averageOrder = Number(summary.avg_order_value ?? 0);
  // active_orders not returned — compute it
  const completed = Number(summary.completed_orders ?? 0);
  const cancelled = Number(summary.cancelled_orders ?? 0);
  const activeOrders = Math.max(0, totalOrders - completed - cancelled);
  // API uses customer_stats.total_unique_customers, repeat_customers, customer_retention_rate_percent
  const uniqueCustomers = Number(customerStats.total_unique_customers ?? 0);
  const returningCustomers = Number(customerStats.repeat_customers ?? 0);
  const retentionRate = Number(customerStats.customer_retention_rate_percent ?? 0);

  const handleApplyCustom = () => {
    if (!startDate || !endDate) {
      setDateError('Veuillez sélectionner une date de début et de fin.');
      return;
    }
    if (startDate > endDate) {
      setDateError('La date de début doit être avant la date de fin.');
      return;
    }
    setDateError(null);
    refetch();
  };

  if (!restaurantId) {
    return (
      <div className="card card-inner bg-amber-500/10 border-amber-500/30 text-amber-200 text-sm">
        Aucun restaurant sélectionné.
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Statistiques</h2>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value as Period);
              setDateError(null);
            }}
            className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 text-sm"
            aria-label="Période"
          >
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50 transition-colors"
            title="Actualiser"
            aria-label="Actualiser les statistiques"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Custom date picker */}
      {period === 'custom' && (
        <div className="card card-inner">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="stat-start" className="block text-xs text-slate-500 mb-1">
                Du
              </label>
              <input
                id="stat-start"
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setDateError(null); }}
                className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="stat-end" className="block text-xs text-slate-500 mb-1">
                Au
              </label>
              <input
                id="stat-end"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => { setEndDate(e.target.value); setDateError(null); }}
                className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyCustom}
              disabled={isFetching}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              Appliquer
            </button>
          </div>
          {dateError && <p className="mt-2 text-xs text-red-400">{dateError}</p>}
        </div>
      )}

      {isLoading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
          <div className="card card-inner animate-pulse h-48" />
        </>
      ) : isError ? (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm py-6 space-y-2">
          <p>{getApiErrorMessage(error)}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Commandes totales" value={totalOrders.toLocaleString('fr-FR')} />
            <StatCard
              label="Revenus totaux"
              value={`${totalRevenue.toLocaleString('fr-FR')} F`}
              accent
            />
            <StatCard
              label="Panier moyen"
              value={`${Math.round(averageOrder).toLocaleString('fr-FR')} F`}
            />
            <StatCard label="Commandes actives" value={activeOrders.toLocaleString('fr-FR')} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Customer metrics */}
            <div className="card card-inner">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Métriques clients</h3>
              <div className="space-y-3">
                <MetricRow label="Clients uniques" value={uniqueCustomers.toLocaleString('fr-FR')} />
                <MetricRow
                  label="Clients récurrents"
                  value={returningCustomers.toLocaleString('fr-FR')}
                />
                <MetricRow
                  label="Taux de rétention"
                  value={`${retentionRate.toFixed(1)} %`}
                  highlight={retentionRate >= 50}
                />
              </div>
            </div>

            {/* Chart placeholder */}
            <div className="card card-inner flex items-center justify-center text-slate-500 min-h-[160px]">
              <div className="flex flex-col items-center gap-2">
                <BarChart3 size={28} className="opacity-40" />
                <span className="text-sm">Graphiques avancés à venir</span>
              </div>
            </div>
          </div>

          {/* Top items table */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 font-medium text-white flex items-center gap-2">
              <Star size={16} className="text-amber-400" />
              Top plats – {PERIOD_LABELS[period]}
            </div>
            {topItems.length === 0 ? (
              <div className="card-inner text-slate-400 text-center py-12">
                Aucun plat disponible pour cette période.
              </div>
            ) : (
              <>
                {/* Mobile cards (< md) */}
                <ul className="md:hidden divide-y divide-slate-700/60">
                  {topItems.map((item, index) => (
                    <li
                      key={item.id ?? `${item.name}-${index}`}
                      className="px-4 py-3 flex items-center gap-3"
                    >
                      <span className="text-slate-500 font-medium text-sm w-5 shrink-0">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{item.name ?? '—'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.category ?? '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-emerald-400 font-medium text-sm">
                          {Number(item.revenue ?? 0).toLocaleString('fr-FR')} F
                        </p>
                        <p className="text-xs text-slate-400">
                          {Number(item.quantity_sold ?? 0).toLocaleString('fr-FR')} cmd.
                          {Number(item.avg_rating ?? 0) > 0 && (
                            <span className="ml-1 text-amber-400">
                              ★ {Number(item.avg_rating).toFixed(1)}
                            </span>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Desktop table (≥ md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Plat</th>
                        <th className="px-4 py-3">Catégorie</th>
                        <th className="px-4 py-3">Commandes</th>
                        <th className="px-4 py-3">Revenus est.</th>
                        <th className="px-4 py-3">Note</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-200 divide-y divide-slate-700/60">
                      {topItems.map((item, index) => (
                        <tr
                          key={item.id ?? `${item.name}-${index}`}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 text-slate-500 font-medium">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-white">{item.name ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-400">{item.category ?? '—'}</td>
                          <td className="px-4 py-3">
                            {Number(item.quantity_sold ?? 0).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-emerald-400 font-medium">
                            {Number(item.revenue ?? 0).toLocaleString('fr-FR')} F
                          </td>
                          <td className="px-4 py-3">
                            {Number(item.avg_rating ?? 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 text-amber-400">
                                <Star size={13} />
                                {Number(item.avg_rating ?? 0).toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="card card-inner space-y-1">
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 last:border-b-0 last:pb-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </span>
    </div>
  );
}
