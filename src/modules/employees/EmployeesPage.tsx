import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Users, Plus, CheckCircle, XCircle } from 'lucide-react';

import { useRestaurantStore } from '../../store/restaurantStore';
import { useToast } from '../../shared/components/ToastProvider';
import { getApiErrorMessage } from '../../lib/apiError';
import {
  staffOwnerApi,
  type RestaurantStaffCreateOwner,
  type RestaurantStaffResponse,
  type RestaurantStaffUpdateOwner,
} from '../../api/staffOwner';

const ROLE_OPTIONS = ['staff', 'chef', 'serveur', 'caisse', 'manager', 'livreur'];

const ROLE_LABELS: Record<string, string> = {
  staff: 'Staff',
  chef: 'Chef',
  serveur: 'Serveur',
  caisse: 'Caisse',
  manager: 'Manager',
  livreur: 'Livreur',
};

export function EmployeesPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const queryClient = useQueryClient();
  const addToast = useToast();

  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('staff');

  const roleOptions = useMemo(() => ROLE_OPTIONS, []);

  const {
    data: staff,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['restaurant-staff', restaurantId],
    enabled: !!restaurantId,
    queryFn: () => staffOwnerApi.list(restaurantId!).then((r) => r.data),
  });

  const staffList = Array.isArray(staff) ? (staff as RestaurantStaffResponse[]) : [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['restaurant-staff', restaurantId] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: RestaurantStaffCreateOwner) =>
      staffOwnerApi.create(restaurantId!, payload).then((r) => r.data),
    onSuccess: (_, { username }) => {
      invalidate();
      setNewUsername('');
      setNewRole('staff');
      addToast(`${username} ajouté à l'équipe`, 'success');
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err), 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ staffId, data }: { staffId: string; data: RestaurantStaffUpdateOwner }) =>
      staffOwnerApi.update(restaurantId!, staffId, data).then((r) => r.data),
    onSuccess: () => {
      invalidate();
      addToast('Employé mis à jour', 'success');
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (staffId: string) => staffOwnerApi.remove(restaurantId!, staffId),
    onSuccess: () => {
      invalidate();
      addToast('Employé retiré', 'success');
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err), 'error');
    },
  });

  const handleToggleActive = (s: RestaurantStaffResponse) => {
    const action = s.is_active ? 'désactiver' : 'activer';
    if (!window.confirm(`Voulez-vous ${action} le compte de ${s.name} ?`)) return;
    updateMutation.mutate({ staffId: s.id, data: { is_active: !s.is_active } });
  };

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
        {staffList.length > 0 && (
          <span className="text-sm text-slate-400">
            {staffList.filter((s) => s.is_active).length} / {staffList.length} actif(s)
          </span>
        )}
      </div>

      {/* Add employee form */}
      <div className="card card-inner">
        <p className="text-sm font-medium text-slate-300 mb-3">Ajouter un employé</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
              <label htmlFor="new-username" className="block text-xs text-slate-500 mb-1">
                Nom d&apos;utilisateur existant
              </label>
              <input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                placeholder="ex: kevin_eats"
                disabled={createMutation.isPending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const username = newUsername.trim();
                    if (username) createMutation.mutate({ username, role: newRole });
                  }
                }}
              />
            </div>
            <div className="w-44">
              <label htmlFor="new-role" className="block text-xs text-slate-500 mb-1">
                Rôle
              </label>
              <select
                id="new-role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                disabled={createMutation.isPending}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
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
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              {createMutation.isPending ? 'Ajout…' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card overflow-hidden animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-4 flex gap-4 border-b border-slate-700">
              <div className="h-4 bg-slate-700 rounded w-1/3" />
              <div className="h-4 bg-slate-700 rounded w-1/4" />
              <div className="h-4 bg-slate-700 rounded w-1/6" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm py-6">
          <p>{getApiErrorMessage(error)}</p>
        </div>
      ) : staffList.length === 0 ? (
        <div className="card card-inner flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
          <Users size={48} className="opacity-60" />
          <p>Aucun employé pour le moment.</p>
          <p className="text-xs text-center max-w-xs">
            Ajoutez un employé via son nom d&apos;utilisateur. Il doit déjà avoir un compte.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Mobile cards (< md) */}
          <ul className="md:hidden divide-y divide-slate-700/60">
            {staffList.map((s) => (
              <li key={s.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{s.name}</p>
                    <p className="text-xs text-slate-400">@{s.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(s)}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 shrink-0 ${
                      s.is_active
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-red-500/20 hover:text-red-400'
                        : 'bg-slate-600 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                    }`}
                  >
                    {s.is_active ? <><CheckCircle size={12} />Actif</> : <><XCircle size={12} />Inactif</>}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={s.role}
                    onChange={(e) => updateMutation.mutate({ staffId: s.id, data: { role: e.target.value } })}
                    disabled={updateMutation.isPending || deleteMutation.isPending}
                    className="flex-1 rounded bg-slate-700 border border-slate-600 text-slate-200 px-2 py-1.5 text-xs disabled:opacity-50"
                    aria-label={`Rôle de ${s.name}`}
                  >
                    {roleOptions.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => { if (!window.confirm(`Retirer ${s.name} de l'équipe ?`)) return; deleteMutation.mutate(s.id); }}
                    disabled={deleteMutation.isPending || updateMutation.isPending}
                    className="p-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                    aria-label={`Retirer ${s.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table (≥ md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">Employé</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-200 divide-y divide-slate-700/60">
                {staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{s.name}</div>
                      <div className="text-xs text-slate-400">@{s.username}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.role}
                        onChange={(e) => updateMutation.mutate({ staffId: s.id, data: { role: e.target.value } })}
                        disabled={updateMutation.isPending || deleteMutation.isPending}
                        className="rounded bg-slate-700 border border-slate-600 text-slate-200 px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
                        aria-label={`Rôle de ${s.name}`}
                      >
                        {roleOptions.map((r) => <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(s)}
                        disabled={updateMutation.isPending || deleteMutation.isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                          s.is_active
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-red-500/20 hover:text-red-400'
                            : 'bg-slate-600 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400'
                        }`}
                        title={s.is_active ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                      >
                        {s.is_active ? <><CheckCircle size={12} />Actif</> : <><XCircle size={12} />Inactif</>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => { if (!window.confirm(`Retirer ${s.name} de l'équipe ?`)) return; deleteMutation.mutate(s.id); }}
                        disabled={deleteMutation.isPending || updateMutation.isPending}
                        className="p-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                        title={`Retirer ${s.name}`}
                        aria-label={`Retirer ${s.name}`}
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
    </div>
  );
}
