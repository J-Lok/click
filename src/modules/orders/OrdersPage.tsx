import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRestaurantStore } from '../../store/restaurantStore';
import { useRestaurantOrders } from '../../hooks/useRestaurantOrders';
import { ordersApi, type OrderStatus } from '../../api/orders';
import { Package, RefreshCw } from 'lucide-react';

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

export function OrdersPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useRestaurantOrders(restaurantId, {
    status: statusFilter || undefined,
    page,
    page_size: 20,
  });

  const errorMessage =
    (error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: { detail?: string }; status?: number } }).response?.data?.detail
      : null) ||
    (error instanceof Error ? error.message : null) ||
    'Erreur lors du chargement des commandes.';

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      ordersApi.updateStatus(orderId, status).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-orders', restaurantId] });
    },
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const hasMore = data?.has_more ?? false;
  const pageSize = data?.page_size ?? 20;

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
            className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600"
            title="Rafraîchir"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="card card-inner text-center text-slate-400 py-12">Chargement...</div>
      ) : isError ? (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm py-6 space-y-2">
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="card card-inner flex flex-col items-center justify-center gap-2 text-slate-400 py-12">
          <Package size={40} />
          <p>Aucune commande</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3">Paiement</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200 divide-y divide-slate-700">
                  {orders.map((o: { id: string; user_name?: string; total_amount?: number; status?: string; payment_status?: string; created_at?: string }) => (
                    <tr key={o.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3">{o.user_name ?? '—'}</td>
                      <td className="px-4 py-3">{(o.total_amount ?? 0).toLocaleString()} FCFA</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-600 text-xs">
                          {STATUS_LABELS[o.status ?? ''] ?? o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{o.payment_status ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {o.created_at ? new Date(o.created_at).toLocaleString('fr-FR') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status ?? ''}
                          onChange={(e) => {
                            const newStatus = e.target.value as OrderStatus;
                            if (newStatus && newStatus !== o.status) {
                              updateStatusMutation.mutate({ orderId: o.id, status: newStatus });
                            }
                          }}
                          disabled={updateStatusMutation.isPending}
                          className="rounded bg-slate-700 border border-slate-600 text-slate-200 px-2 py-1 text-xs min-w-[120px]"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                        {updateStatusMutation.isError && updateStatusMutation.variables?.orderId === o.id && (
                          <span className="ml-1 text-xs text-red-400">Erreur</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              {orders.length} / {total} commandes
            </span>
            {hasMore && (
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
              >
                Page suivante
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
