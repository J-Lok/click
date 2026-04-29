import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ArrowRight, ShoppingCart, Wallet,
  Clock, Star, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { useRestaurantStore } from '../../store/restaurantStore';
import { ownerApi } from '../../api/owner';

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardSummary {
  total_orders_today: number;
  total_revenue_today: number;
  total_revenue_this_month: number;
  pending_orders: number;
  average_rating: number;
  total_customers: number;
  total_restaurants: number;
}

interface RecentOrder {
  id: string;
  restaurant_name: string;
  status: string;
  payment_status: string;
  total_amount: number;
  items_count: number;
  created_at: string;
}

interface LowStockAlert {
  item_id: string;
  item_name: string;
  restaurant_name: string;
  stock_quantity: number;
  alert_level: number;
}

interface PerformanceToday {
  orders_count: number;
  confirmed_rate: string;
  delivery_rate: string;
  avg_order_value: number;
  avg_prep_time_minutes: string;
}

interface DashboardData {
  summary: DashboardSummary;
  recent_orders: RecentOrder[];
  low_stock_alerts: LowStockAlert[];
  performance_metrics: { today: PerformanceToday; month: Record<string, unknown> };
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="card card-inner animate-pulse space-y-3">
      <div className="h-3 bg-slate-700 rounded w-1/2" />
      <div className="h-8 bg-slate-700 rounded w-3/4" />
      <div className="h-3 bg-slate-700 rounded w-1/3" />
    </div>
  );
}

const PAYMENT_LABEL: Record<string, string> = {
  completed: 'Payé',
  paid: 'Payé',
  pending: 'Non payé',
  failed: 'Échoué',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  in_delivery: 'En livraison',
  delivered: 'Livrée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<DashboardData>({
    queryKey: ['owner-dashboard'],
    queryFn: () => ownerApi.getDashboard().then((r) => r.data as DashboardData),
    enabled: true,
    staleTime: 0,              // toujours re-fetch à l'ouverture de l'onglet
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // auto-refresh toutes les 2 minutes
  });

  if (!restaurantId) {
    return (
      <div className="card card-inner bg-amber-500/10 border-amber-500/30 text-amber-200 text-sm flex items-start gap-3">
        <span className="text-lg">⚠️</span>
        <div>
          <p className="font-medium">Aucun restaurant associé à votre compte.</p>
          <p className="mt-1 text-amber-300/70 text-xs">
            Créez un restaurant ou contactez l&apos;administrateur.
          </p>
        </div>
      </div>
    );
  }

  const summary = data?.summary;
  const recentOrders = data?.recent_orders ?? [];
  const alerts = data?.low_stock_alerts ?? [];
  const perf = data?.performance_metrics?.today;

  const widgets = [
    {
      label: "CA aujourd'hui",
      value: `${(summary?.total_revenue_today ?? 0).toLocaleString('fr-FR')} F`,
      sub: `${(summary?.total_revenue_this_month ?? 0).toLocaleString('fr-FR')} F ce mois`,
      icon: Wallet,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Commandes aujourd\'hui',
      value: String(summary?.total_orders_today ?? 0),
      sub: `${summary?.pending_orders ?? 0} en attente`,
      icon: ShoppingCart,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Panier moyen',
      value: perf?.avg_order_value
        ? `${perf.avg_order_value.toLocaleString('fr-FR')} F`
        : '—',
      sub: `Prep. moy. ${perf?.avg_prep_time_minutes ?? 'N/A'} min`,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Note moyenne',
      value: (summary?.average_rating ?? 0) > 0
        ? (summary!.average_rating).toFixed(1)
        : '—',
      sub: `${summary?.total_customers ?? 0} client(s) unique(s)`,
      icon: Star,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ];

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Vue d&apos;ensemble</h2>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">{todayLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50 transition-colors"
          title="Actualiser"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : widgets.map((w) => {
              const Icon = w.icon;
              return (
                <div key={w.label} className="card card-inner space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 uppercase tracking-wide">{w.label}</p>
                    <div className={`p-1.5 rounded-lg ${w.bg}`}>
                      <Icon size={14} className={w.color} />
                    </div>
                  </div>
                  <p className={`text-2xl font-bold ${w.color}`}>{w.value}</p>
                  {w.sub && <p className="text-xs text-slate-500">{w.sub}</p>}
                </div>
              );
            })}
      </div>

      {isError && (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm flex items-center justify-between">
          <span>Impossible de charger le dashboard.</span>
          <button type="button" onClick={() => refetch()} className="underline text-xs">
            Réessayer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-medium text-white text-sm">Commandes récentes (aujourd&apos;hui)</h2>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Voir tout <ArrowRight size={13} />
            </Link>
          </div>
          <div className="card-inner">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex justify-between gap-4">
                    <div className="h-3 bg-slate-700 rounded w-1/3" />
                    <div className="h-3 bg-slate-700 rounded w-1/5" />
                    <div className="h-3 bg-slate-700 rounded w-1/6" />
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <ul className="divide-y divide-slate-700/60">
                {recentOrders.map((o) => (
                  <li key={o.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white truncate">
                          {o.restaurant_name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(o.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                        <span className="text-xs text-slate-600">·</span>
                        <span
                          className={`text-xs ${
                            o.payment_status === 'completed' || o.payment_status === 'paid'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {PAYMENT_LABEL[o.payment_status] ?? o.payment_status}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold text-emerald-400 shrink-0 whitespace-nowrap">
                      {(o.total_amount ?? 0).toLocaleString('fr-FR')} F
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-500">
                <TrendingUp size={28} className="opacity-40" />
                <p className="text-sm">Aucune commande aujourd&apos;hui</p>
              </div>
            )}
          </div>
        </div>

        {/* Low stock alerts + perf */}
        <div className="space-y-4">
          {/* Performance */}
          {perf && (
            <div className="card card-inner">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Performance du jour</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Taux confirmé</p>
                  <p className="font-semibold text-white">{perf.confirmed_rate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Taux livraison</p>
                  <p className="font-semibold text-white">{perf.delivery_rate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Panier moyen</p>
                  <p className="font-semibold text-white">
                    {(perf.avg_order_value ?? 0).toLocaleString('fr-FR')} F
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Préparation moy.</p>
                  <p className="font-semibold text-white">
                    {perf.avg_prep_time_minutes !== 'N/A'
                      ? `${perf.avg_prep_time_minutes} min`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stock alerts */}
          <div className="card">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-400" />
                <h3 className="text-sm font-medium text-white">Alertes stock</h3>
              </div>
              <Link
                to="/stock"
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                Voir tout
              </Link>
            </div>
            <div className="card-inner">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-3 bg-slate-700 rounded" />
                  ))}
                </div>
              ) : alerts.length > 0 ? (
                <ul className="divide-y divide-slate-700/60">
                  {alerts.slice(0, 5).map((a) => {
                    const pct =
                      a.alert_level > 0
                        ? Math.min(100, (a.stock_quantity / a.alert_level) * 100)
                        : 0;
                    return (
                      <li key={a.item_id} className="py-2.5 flex items-center gap-3 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{a.item_name}</p>
                          <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden w-24">
                            <div
                              className={`h-full rounded-full ${
                                pct === 0 ? 'bg-red-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-amber-400 shrink-0">
                          {a.stock_quantity}/{a.alert_level}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  Aucune alerte stock
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
