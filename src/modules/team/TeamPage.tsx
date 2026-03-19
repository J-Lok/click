import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRestaurantStore } from '../../store/restaurantStore';
import { useAuthStore } from '../../store/authStore';
import { useTeam } from '../../hooks/useTeam';
import { teamApi } from '../../api/team';
import { getApiErrorMessage } from '../../lib/apiError';
import { useToast } from '../../shared/components/ToastProvider';
import { hasPermission } from '../../lib/permissions';
import type { StaffMember, StaffRole, InviteStaffPayload, UpdateStaffPayload } from '../../types';
import { ROLE_LABELS, ROLE_PERMISSIONS, STAFF_ROLES } from '../../types';
import {
  UserCog,
  Plus,
  Pencil,
  UserX,
  UserCheck,
  Shield,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

// ── Role badge colours ────────────────────────────────────────────────────────

const ROLE_COLORS: Record<StaffRole, string> = {
  restaurant_owner: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  manager:          'bg-blue-500/20 text-blue-300 border-blue-500/30',
  cashier:          'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  waiter:           'bg-amber-500/20 text-amber-300 border-amber-500/30',
  chef:             'bg-orange-500/20 text-orange-300 border-orange-500/30',
  delivery:         'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

function RoleBadge({ role }: { role: StaffRole }) {
  return (
    <span
      className={`inline-flex items-center text-xs px-2 py-0.5 rounded border ${ROLE_COLORS[role] ?? 'bg-slate-600 text-slate-300'}`}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

// ── Inline permission accordion ───────────────────────────────────────────────

const ALL_RESOURCES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'floor',     label: 'Plan de salle' },
  { key: 'orders',    label: 'Commandes' },
  { key: 'menu',      label: 'Menu' },
  { key: 'stock',     label: 'Stock' },
  { key: 'employees', label: 'Employés' },
  { key: 'team',      label: 'Équipe' },
];

function PermissionMatrix({ role }: { role: StaffRole }) {
  const [open, setOpen] = useState(false);
  const perms = ROLE_PERMISSIONS[role] ?? [];
  const isAll = perms.includes('*');

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Shield size={12} />
        Voir les accès
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-1 bg-slate-800 rounded p-2">
          {ALL_RESOURCES.map(({ key, label }) => {
            const has = isAll || perms.includes(key);
            return (
              <div
                key={key}
                className={`flex items-center gap-1.5 text-xs ${has ? 'text-emerald-400' : 'text-slate-600'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${has ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                {label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Invite / Edit modal ───────────────────────────────────────────────────────

interface ModalProps {
  mode: 'invite' | 'edit';
  member?: StaffMember;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onInvite: (data: InviteStaffPayload) => void;
  onUpdate: (data: UpdateStaffPayload) => void;
}

function StaffModal({ mode, member, loading, error, onClose, onInvite, onUpdate }: ModalProps) {
  const [name,     setName]     = useState(member?.name     ?? '');
  const [username, setUsername] = useState(member?.username ?? '');
  const [password, setPassword] = useState('');
  const [phone,    setPhone]    = useState(member?.phone    ?? '+237');
  const [email,    setEmail]    = useState(member?.email    ?? '');
  const [role,     setRole]     = useState<StaffRole>(
    (member?.role as StaffRole) ?? 'waiter'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'invite') {
      if (!name.trim() || !username.trim() || password.length < 8) return;
      onInvite({
        name: name.trim(),
        username: username.trim(),
        password,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        role,
      });
    } else {
      onUpdate({
        name: name.trim() || undefined,
        role,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-600">
          <h3 className="text-base font-semibold text-white">
            {mode === 'invite' ? 'Inviter un membre' : `Modifier – ${member?.name}`}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nom complet *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
            />
          </div>

          {mode === 'invite' && (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nom d'utilisateur *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Mot de passe * <span className="text-slate-500">(min. 8 caractères)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237690000000"
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Rôle *</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as StaffRole)}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 text-sm"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <PermissionMatrix role={role} />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm"
            >
              {loading
                ? 'Enregistrement...'
                : mode === 'invite'
                  ? 'Inviter'
                  : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Member row ────────────────────────────────────────────────────────────────

function MemberRow({
  member,
  isSelf,
  canManage,
  onEdit,
  onToggle,
  onRemove,
}: {
  member: StaffMember;
  isSelf: boolean;
  canManage: boolean;
  onEdit: () => void;
  onToggle: (active: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <li className="px-4 py-3 flex items-center gap-3">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-200 shrink-0 uppercase select-none">
        {member.name.slice(0, 2)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-white text-sm truncate">{member.name}</span>
          {isSelf && <span className="text-xs text-slate-500">(vous)</span>}
          <RoleBadge role={member.role as StaffRole} />
          {!member.is_active && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-500">
              inactif
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">@{member.username}</p>
        {(member.phone || member.email) && (
          <p className="text-xs text-slate-600 truncate">
            {[member.phone, member.email].filter(Boolean).join(' · ')}
          </p>
        )}
        {member.last_login && (
          <p className="text-xs text-slate-600 mt-0.5">
            Dernière connexion :{' '}
            {new Date(member.last_login).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>

      {/* Actions — hidden for yourself */}
      {canManage && !isSelf && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
            title="Modifier"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onToggle(!member.is_active)}
            className={`p-1.5 rounded ${
              member.is_active
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
            }`}
            title={member.is_active ? 'Désactiver' : 'Réactiver'}
          >
            {member.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400"
            title="Retirer de l'équipe"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </li>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function TeamPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const currentUser  = useAuthStore((s) => s.user);
  const queryClient  = useQueryClient();
  const addToast     = useToast();

  const { data: teamData, isLoading, isError, error } = useTeam(restaurantId);

  const [inviting,      setInviting]      = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['team', restaurantId] });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteStaffPayload) => teamApi.invite(restaurantId!, data),
    onSuccess: () => {
      invalidate();
      setInviting(false);
      setMutationError(null);
      addToast('Membre ajouté à l\'équipe', 'success');
    },
    onError: (err) => setMutationError(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffPayload }) =>
      teamApi.update(restaurantId!, id, data),
    onSuccess: () => {
      invalidate();
      setEditingMember(null);
      setMutationError(null);
      addToast('Membre mis à jour', 'success');
    },
    onError: (err) => setMutationError(getApiErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      teamApi.update(restaurantId!, id, { is_active: active }),
    onSuccess: (_, vars) => {
      invalidate();
      addToast(vars.active ? 'Membre réactivé' : 'Membre désactivé', 'info');
    },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => teamApi.deactivate(restaurantId!, id),
    onSuccess: () => { invalidate(); addToast('Membre retiré de l\'équipe', 'info'); },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  });

  const canManage = hasPermission(currentUser?.role, 'team');
  const members: StaffMember[] = Array.isArray(teamData) ? teamData : [];
  const active   = members.filter((m) => m.is_active);
  const inactive = members.filter((m) => !m.is_active);

  if (!restaurantId) {
    return (
      <div className="card card-inner bg-amber-500/10 border-amber-500/30 text-amber-200 text-sm">
        Aucun restaurant sélectionné.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Équipe</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {active.length} membre{active.length !== 1 ? 's' : ''} actif{active.length !== 1 ? 's' : ''}
            {inactive.length > 0 &&
              ` · ${inactive.length} inactif${inactive.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => { setMutationError(null); setInviting(true); }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium"
          >
            <Plus size={18} />
            Inviter un membre
          </button>
        )}
      </div>

      {/* Role legend card */}
      <div className="card card-inner">
        <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
          Rôles &amp; accès
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {([...STAFF_ROLES, 'restaurant_owner'] as StaffRole[]).map((r) => (
            <div key={r} className="space-y-1.5">
              <RoleBadge role={r} />
              <p className="text-xs text-slate-500 leading-relaxed pl-0.5">
                {ROLE_PERMISSIONS[r].includes('*')
                  ? 'Accès complet'
                  : ROLE_PERMISSIONS[r].join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Members */}
      {isLoading ? (
        <div className="card card-inner text-center text-slate-400 py-12">Chargement...</div>
      ) : isError ? (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm py-6">
          {getApiErrorMessage(error)}
        </div>
      ) : members.length === 0 ? (
        <div className="card card-inner flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
          <UserCog size={48} className="opacity-40" />
          <p>Aucun membre dans l'équipe</p>
          {canManage && (
            <button
              type="button"
              onClick={() => setInviting(true)}
              className="text-primary-400 hover:underline text-sm"
            >
              Inviter le premier membre
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-600 text-xs font-medium text-slate-400 uppercase tracking-wide">
                Actifs ({active.length})
              </div>
              <ul className="divide-y divide-slate-700/50">
                {active.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    isSelf={m.id === currentUser?.id}
                    canManage={canManage}
                    onEdit={() => { setMutationError(null); setEditingMember(m); }}
                    onToggle={(a) => toggleMutation.mutate({ id: m.id, active: a })}
                    onRemove={() => {
                      if (window.confirm(`Retirer ${m.name} de l'équipe ?`)) {
                        removeMutation.mutate(m.id);
                      }
                    }}
                  />
                ))}
              </ul>
            </div>
          )}

          {inactive.length > 0 && (
            <div className="card overflow-hidden opacity-60">
              <div className="px-4 py-2.5 border-b border-slate-600 text-xs font-medium text-slate-500 uppercase tracking-wide">
                Inactifs ({inactive.length})
              </div>
              <ul className="divide-y divide-slate-700/40">
                {inactive.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    isSelf={false}
                    canManage={canManage}
                    onEdit={() => { setMutationError(null); setEditingMember(m); }}
                    onToggle={(a) => toggleMutation.mutate({ id: m.id, active: a })}
                    onRemove={() => {
                      if (window.confirm(`Retirer ${m.name} ?`)) {
                        removeMutation.mutate(m.id);
                      }
                    }}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {inviting && (
        <StaffModal
          mode="invite"
          loading={inviteMutation.isPending}
          error={mutationError}
          onClose={() => { setInviting(false); setMutationError(null); }}
          onInvite={(data) => inviteMutation.mutate(data)}
          onUpdate={() => {}}
        />
      )}
      {editingMember && (
        <StaffModal
          mode="edit"
          member={editingMember}
          loading={updateMutation.isPending}
          error={mutationError}
          onClose={() => { setEditingMember(null); setMutationError(null); }}
          onInvite={() => {}}
          onUpdate={(data) => updateMutation.mutate({ id: editingMember.id, data })}
        />
      )}
    </div>
  );
}