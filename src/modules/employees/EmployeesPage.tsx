import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Users, Plus } from 'lucide-react';

import { useRestaurantStore } from '../../store/restaurantStore';
import { staffOwnerApi, type RestaurantStaffCreateOwner, type RestaurantStaffResponse, type RestaurantStaffUpdateOwner } from '../../api/staffOwner';

export function EmployeesPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const queryClient = useQueryClient();

  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('staff');

  const roleOptions = useMemo(
    () => ['staff', 'chef', 'serveur', 'caisse', 'manager', 'livreur'],
    []
  );

  const getErrorMessage = (err: unknown) => {
    if (err && typeof err === 'object' && 'response' in err) {
      const e = err as { response?: { data?: { detail?: unknown } } };
      const detail = e.response?.data?.detail;
      if (typeof detail === 'string') return detail;
    }
    return 'Erreur lors de l\'opération.';
  };

  const {
    data: staff,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['restaurant-staff', restaurantId],
    enabled: !!restaurantId,
    queryFn: () =>
      staffOwnerApi.list(restaurantId!).then((r) => r.data),
  });

  const staffList = Array.isArray(staff) ? (staff as RestaurantStaffResponse[]) : [];

  const createMutation = useMutation({
    mutationFn: (payload: RestaurantStaffCreateOwner) =>
      staffOwnerApi.create(restaurantId!, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff', restaurantId] });
      setNewUsername('');
      setNewRole('staff');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      staffId,
      data,
    }: {
      staffId: string;
      data: RestaurantStaffUpdateOwner;
    }) => staffOwnerApi.update(restaurantId!, staffId, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff', restaurantId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (staffId: string) => staffOwnerApi.remove(restaurantId!, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-staff', restaurantId] });
    },
  });

  if (!restaurantId) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Employés</h2>
      <div className="card card-inner flex flex-col items-center justify-center gap-4 text-slate-400 py-16">
        <Users size={48} className="opacity-60" />
        <p className="text-center max-w-sm">Aucun restaurant sélectionné.</p>
      </div>
    </div>
  );
}

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">Employés</h2>
        <div className="text-sm text-slate-400">
          Staff : {staffList.length}
        </div>
      </div>

      <div className="card card-inner">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs text-slate-500 mb-1">Nom d'utilisateur</label>
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
                placeholder="ex: kevin_eats"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="w-44">
              <label className="block text-xs text-slate-500 mb-1">Rôle</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
                disabled={createMutation.isPending}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                const username = newUsername.trim();
                if (!username) return;
                createMutation.mutate({ username, role: newRole });
              }}
              disabled={createMutation.isPending || !newUsername.trim()}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium"
            >
              <Plus size={16} />
              Ajouter
            </button>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-red-400">{getErrorMessage(createMutation.error)}</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="card card-inner text-center text-slate-400 py-12">Chargement...</div>
      ) : isError ? (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm py-6 space-y-2">
          <p>{getErrorMessage(error)}</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="card card-inner flex flex-col items-center justify-center gap-2 text-slate-400 py-12">
          <Users size={40} className="opacity-70" />
          <p>Aucun employé pour le moment.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800 text-slate-300">
                <tr>
                  <th className="px-4 py-3">Employé</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Actif</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-200 divide-y divide-slate-700">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.username}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.role}
                        onChange={(e) =>
                          updateMutation.mutate({
                            staffId: s.id,
                            data: { role: e.target.value },
                          })
                        }
                        disabled={updateMutation.isPending}
                        className="rounded bg-slate-700 border border-slate-600 text-slate-200 px-2 py-1 text-xs"
                      >
                        {roleOptions.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={s.is_active}
                        onChange={(e) =>
                          updateMutation.mutate({
                            staffId: s.id,
                            data: { is_active: e.target.checked },
                          })
                        }
                        disabled={updateMutation.isPending}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm(`Supprimer ${s.name} ?`)) return;
                          deleteMutation.mutate(s.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(updateMutation.isError || deleteMutation.isError) && (
        <div className="text-sm text-red-400">
          {getErrorMessage(updateMutation.error ?? deleteMutation.error)}
        </div>
      )}
    </div>
  );
}
