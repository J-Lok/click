import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRestaurantStore } from '../../store/restaurantStore';
import { useRestaurantOrders } from '../../hooks/useRestaurantOrders';
import { ordersApi, type OrderStatus } from '../../api/orders';
import { useToast } from '../../shared/components/ToastProvider';
import { getApiErrorMessage } from '../../lib/apiError';
import { Package, RefreshCw, ChevronLeft, ChevronRight, Banknote } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  in_delivery: 'En livraison',
  delivered: 'Livrée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  preparing: 'bg-purple-500/20 text-purple-400',
  ready: 'bg-emerald-500/20 text-emerald-400',
  in_delivery: 'bg-cyan-500/20 text-cyan-400',
  delivered: 'bg-green-500/20 text-green-400',
  completed: 'bg-slate-500/20 text-slate-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Non payé',
  processing: 'En cours',
  completed: 'Payé',
  failed: 'Échoué',
  refunded: 'Remboursé',
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: 'text-amber-400',
  processing: 'text-blue-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
  refunded: 'text-slate-400',
};

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'in_delivery',
  'delivered',
  'completed',
  'cancelled',
];

const PAGE_SIZE = 20;

type OrderRow = {
  id: string;
  user_name?: string;
  total_amount?: number;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  created_at?: string;
};

export function OrdersPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const queryClient = useQueryClient();
  const addToast = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useRestaurantOrders(
    restaurantId,
    { status: statusFilter || undefined, page, page_size: PAGE_SIZE }
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] });
    queryClient.invalidateQueries({ queryKey: ['restaurant-pending-orders', restaurantId] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      setUpdatingOrderId(orderId);
      const r = await ordersApi.updateStatus(orderId, status);
      return r.data;
    },
    onSuccess: (_, { status }) => {
      invalidate();
      addToast(`Statut mis à jour : ${STATUS_LABELS[status] ?? status}`, 'success');
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err), 'error');
    },
    onSettled: () => setUpdatingOrderId(null),
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (orderId: string) => {
      setMarkingPaidId(orderId);
      const r = await ordersApi.markAsPaid(orderId);
      return r.data;
    },
    onSuccess: () => {
      invalidate();
      addToast('Commande marquée comme payée', 'success');
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err), 'error');
    },
    onSettled: () => setMarkingPaidId(null),
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.has_more ?? false;

  if (!restaurantId) {
    return (
      <div className="card card-inner bg-amber-500/10 border-amber-500/30 text-amber-200 text-sm">
        Aucun restaurant sélectionné.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">Commandes</h2>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 text-sm"
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 transition-colors"
            title="Rafraîchir"
            aria-label="Rafraîchir la liste"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card overflow-hidden animate-pulse">
          <div className="divide-y divide-slate-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-4 flex gap-4">
                <div className="h-4 bg-slate-700 rounded w-1/4" />
                <div className="h-4 bg-slate-700 rounded w-1/6" />
                <div className="h-4 bg-slate-700 rounded w-1/5" />
                <div className="h-4 bg-slate-700 rounded w-1/6" />
                <div className="h-4 bg-slate-700 rounded w-1/4" />
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm py-6 space-y-2">
          <p>{getApiErrorMessage(error)}</p>
          <button type="button" onClick={() => refetch()} className="underline hover:no-underline">
            Réessayer
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="card card-inner flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
          <Package size={48} className="opacity-60" />
          <p>
            {statusFilter
              ? `Aucune commande avec le statut « ${STATUS_LABELS[statusFilter] ?? statusFilter} »`
              : 'Aucune commande'}
          </p>
          {statusFilter && (
            <button
              type="button"
              onClick={() => setStatusFilter('')}
              className="text-sm text-slate-300 underline hover:no-underline"
            >
              Voir toutes les commandes
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Mobile card list (< md) ─────────────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {(orders as OrderRow[]).map((o) => {
              const isStatusUpdating = updatingOrderId === o.id;
              const isMarkingPaid = markingPaidId === o.id;
              const isPaid = o.payment_status === 'completed' || o.payment_status === 'paid';
              const anyPending = updateStatusMutation.isPending || markAsPaidMutation.isPending;
              return (
                <div key={o.id} className="card card-inner space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{o.user_name ?? '—'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {o.created_at
                          ? new Date(o.created_at).toLocaleString('fr-FR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-400 whitespace-nowrap shrink-0">
                      {(o.total_amount ?? 0).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[o.status ?? ''] ?? 'bg-slate-600 text-slate-300'
                      }`}
                    >
                      {STATUS_LABELS[o.status ?? ''] ?? o.status ?? '—'}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        PAYMENT_COLORS[o.payment_status ?? ''] ?? 'text-slate-400'
                      }`}
                    >
                      {PAYMENT_LABELS[o.payment_status ?? ''] ?? '—'}
                    </span>
                    {o.payment_method && (
                      <span className="text-xs text-slate-500 capitalize">
                        {o.payment_method.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                    <div className="flex items-center gap-1 flex-1 min-w-0">
                      <select
                        value={o.status ?? ''}
                        onChange={(e) => {
                          const newStatus = e.target.value as OrderStatus;
                          if (newStatus && newStatus !== o.status) {
                            updateStatusMutation.mutate({ orderId: o.id, status: newStatus });
                          }
                        }}
                        disabled={isStatusUpdating || anyPending}
                        className={`flex-1 rounded bg-slate-700 border border-slate-600 text-slate-200 px-2 py-1.5 text-xs transition-opacity ${
                          isStatusUpdating ? 'opacity-50 cursor-wait' : ''
                        }`}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      {isStatusUpdating && (
                        <RefreshCw size={14} className="animate-spin text-slate-400 shrink-0" />
                      )}
                    </div>
                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Confirmer le paiement de ${o.user_name ?? 'ce client'} (${(o.total_amount ?? 0).toLocaleString('fr-FR')} F) ?`)) {
                            markAsPaidMutation.mutate(o.id);
                          }
                        }}
                        disabled={isMarkingPaid || anyPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${
                          isMarkingPaid
                            ? 'bg-emerald-700/40 text-emerald-400 cursor-wait'
                            : 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/30'
                        } disabled:opacity-50`}
                      >
                        {isMarkingPaid ? <RefreshCw size={12} className="animate-spin" /> : <Banknote size={13} />}
                        {isMarkingPaid ? 'En cours…' : 'Payé'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Desktop table (≥ md) ────────────────────────────────────────── */}
          <div className="hidden md:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Paiement</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200 divide-y divide-slate-700/60">
                  {(orders as OrderRow[]).map((o) => {
                    const isStatusUpdating = updatingOrderId === o.id;
                    const isMarkingPaid = markingPaidId === o.id;
                    const isPaid = o.payment_status === 'completed' || o.payment_status === 'paid';
                    const anyPending =
                      updateStatusMutation.isPending || markAsPaidMutation.isPending;

                    return (
                      <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">
                          {o.user_name ?? <span className="text-slate-500">—</span>}
                        </td>
                        <td className="px-4 py-3 text-emerald-400 font-medium whitespace-nowrap">
                          {(o.total_amount ?? 0).toLocaleString('fr-FR')} F
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              STATUS_COLORS[o.status ?? ''] ?? 'bg-slate-600 text-slate-300'
                            }`}
                          >
                            {STATUS_LABELS[o.status ?? ''] ?? o.status ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`text-xs font-medium ${
                                PAYMENT_COLORS[o.payment_status ?? ''] ?? 'text-slate-400'
                              }`}
                            >
                              {PAYMENT_LABELS[o.payment_status ?? ''] ?? o.payment_status ?? '—'}
                            </span>
                            {o.payment_method && (
                              <span className="text-xs text-slate-500 capitalize">
                                {o.payment_method.replace(/_/g, ' ')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                          {o.created_at
                            ? new Date(o.created_at).toLocaleString('fr-FR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Sélecteur de statut commande */}
                            <div className="flex items-center gap-1">
                              <select
                                value={o.status ?? ''}
                                onChange={(e) => {
                                  const newStatus = e.target.value as OrderStatus;
                                  if (newStatus && newStatus !== o.status) {
                                    updateStatusMutation.mutate({
                                      orderId: o.id,
                                      status: newStatus,
                                    });
                                  }
                                }}
                                disabled={isStatusUpdating || anyPending}
                                aria-label={`Changer le statut de la commande de ${o.user_name ?? o.id}`}
                                className={`rounded bg-slate-700 border border-slate-600 text-slate-200 px-2 py-1 text-xs min-w-[130px] transition-opacity ${
                                  isStatusUpdating ? 'opacity-50 cursor-wait' : ''
                                }`}
                              >
                                {ORDER_STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {STATUS_LABELS[s]}
                                  </option>
                                ))}
                              </select>
                              {isStatusUpdating && (
                                <RefreshCw size={14} className="animate-spin text-slate-400 shrink-0" />
                              )}
                            </div>

                            {/* Bouton "Marquer payé" — visible tant que non payé */}
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `Confirmer le paiement de la commande de ${o.user_name ?? 'ce client'} (${(o.total_amount ?? 0).toLocaleString('fr-FR')} F) ?`
                                    )
                                  ) {
                                    markAsPaidMutation.mutate(o.id);
                                  }
                                }}
                                disabled={isMarkingPaid || anyPending}
                                title="Marquer comme payé (espèces ou autre)"
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                  isMarkingPaid
                                    ? 'bg-emerald-700/40 text-emerald-400 cursor-wait'
                                    : 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-600/30'
                                } disabled:opacity-50`}
                              >
                                {isMarkingPaid ? (
                                  <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                  <Banknote size={13} />
                                )}
                                {isMarkingPaid ? 'En cours…' : 'Marquer payé'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total}{' '}
              commande(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Page précédente"
              >
                <ChevronLeft size={16} />
                Précédent
              </button>
              <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs">
                Page {page}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Page suivante"
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
