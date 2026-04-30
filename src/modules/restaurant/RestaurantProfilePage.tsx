import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Trash2, Store, Save, ImageOff } from 'lucide-react';
import { useRestaurantStore } from '../../store/restaurantStore';
import { restaurantsApi } from '../../api/restaurants';
import { filesApi } from '../../api/files';
import { useToast } from '../../shared/components/ToastProvider';
import { getApiErrorMessage } from '../../lib/apiError';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?? (import.meta.env.DEV ? 'http://localhost:8000' : '');

function resolveUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

// ── Photo upload zone ─────────────────────────────────────────────────────────

function PhotoZone({
  label,
  hint,
  current,
  aspectClass,
  disabled,
  onUpload,
  onDelete,
}: {
  label: string;
  hint: string;
  current?: string | null;
  aspectClass: string;
  disabled: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(resolveUrl(current));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onUpload(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-300">{label}</p>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
        {preview && (
          <button
            type="button"
            onClick={() => {
              setPreview(undefined);
              if (inputRef.current) inputRef.current.value = '';
              onDelete();
            }}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs transition-colors disabled:opacity-50"
          >
            <Trash2 size={13} />
            Supprimer
          </button>
        )}
      </div>

      <div
        className={`relative w-full ${aspectClass} rounded-xl overflow-hidden bg-slate-700/60 border-2 border-dashed border-slate-600 hover:border-emerald-500 cursor-pointer transition-colors group`}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <Camera size={24} className="text-white" />
              <span className="text-white text-sm font-medium">Changer la photo</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
            <ImageOff size={28} className="opacity-60" />
            <span className="text-sm">Cliquer pour ajouter</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
        disabled={disabled}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface RestaurantData {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string | null;
  cover_image_url?: string | null;
}

export function RestaurantProfilePage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const queryClient = useQueryClient();
  const addToast = useToast();

  const { data: restaurant, isLoading } = useQuery<RestaurantData>({
    queryKey: ['restaurant-detail', restaurantId],
    queryFn: () => restaurantsApi.get(restaurantId!).then((r) => r.data as RestaurantData),
    enabled: !!restaurantId,
  });

  // Info edit form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [infoEdited, setInfoEdited] = useState(false);

  // Populate form once data loads
  const populated = useRef(false);
  if (restaurant && !populated.current) {
    populated.current = true;
    setName(restaurant.name ?? '');
    setDescription(restaurant.description ?? '');
    setAddress(restaurant.address ?? '');
    setPhone(restaurant.phone ?? '');
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['restaurant-detail', restaurantId] });
    // Also refresh the name in AppLayout
    queryClient.invalidateQueries({ queryKey: ['restaurant-name', restaurantId] });
  };

  // ── Photo mutations ─────────────────────────────────────────────────────────

  const logoUploadMutation = useMutation({
    mutationFn: (file: File) => filesApi.uploadRestaurantLogo(restaurantId!, file),
    onSuccess: () => { invalidate(); addToast('Logo mis à jour', 'success'); },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  });

  const logoDeleteMutation = useMutation({
    mutationFn: () => filesApi.deleteRestaurantLogo(restaurantId!),
    onSuccess: () => { invalidate(); addToast('Logo supprimé', 'success'); },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  });

  const coverUploadMutation = useMutation({
    mutationFn: (file: File) => filesApi.uploadRestaurantCover(restaurantId!, file),
    onSuccess: () => { invalidate(); addToast('Photo de couverture mise à jour', 'success'); },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  });

  const coverDeleteMutation = useMutation({
    mutationFn: () => filesApi.deleteRestaurantCover(restaurantId!),
    onSuccess: () => { invalidate(); addToast('Photo de couverture supprimée', 'success'); },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  });

  // ── Info mutation ───────────────────────────────────────────────────────────

  const infoMutation = useMutation({
    mutationFn: () =>
      restaurantsApi.update(restaurantId!, {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setInfoEdited(false);
      addToast('Informations mises à jour', 'success');
    },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  });

  const anyPending =
    logoUploadMutation.isPending ||
    logoDeleteMutation.isPending ||
    coverUploadMutation.isPending ||
    coverDeleteMutation.isPending ||
    infoMutation.isPending;

  if (!restaurantId) {
    return (
      <div className="card card-inner bg-amber-500/10 border-amber-500/30 text-amber-200 text-sm">
        Aucun restaurant sélectionné.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Store size={22} className="text-emerald-400" />
        <h2 className="text-lg font-semibold text-white">Profil du restaurant</h2>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-40 bg-slate-700 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ── Photos section ─────────────────────────────────────────────── */}
          <div className="card card-inner space-y-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Photos
            </h3>

            {/* Cover photo — wide banner, appears as the hero in the customer app */}
            <PhotoZone
              label="Photo de couverture"
              hint="Bandeau principal affiché sur la page client · 16:9 recommandé · max 5 MB"
              current={restaurant?.cover_image_url}
              aspectClass="aspect-video"
              disabled={anyPending}
              onUpload={(file) => coverUploadMutation.mutate(file)}
              onDelete={() => coverDeleteMutation.mutate()}
            />

            {/* Logo — small square icon */}
            <PhotoZone
              label="Logo"
              hint="Icône carrée du restaurant · 500×500px min · max 5 MB"
              current={restaurant?.logo_url}
              aspectClass="aspect-square max-w-[180px]"
              disabled={anyPending}
              onUpload={(file) => logoUploadMutation.mutate(file)}
              onDelete={() => logoDeleteMutation.mutate()}
            />

            {anyPending && (
              <p className="text-xs text-emerald-400 animate-pulse">
                Envoi en cours…
              </p>
            )}
          </div>

          {/* ── Preview ────────────────────────────────────────────────────── */}
          <div className="card card-inner space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Aperçu côté client
            </h3>
            <div className="relative rounded-xl overflow-hidden bg-slate-700/60 aspect-video border border-slate-600">
              {restaurant?.cover_image_url || restaurant?.logo_url ? (
                <img
                  src={resolveUrl(restaurant.cover_image_url || restaurant.logo_url)}
                  alt="Aperçu"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-600">
                  <Store size={40} className="opacity-40" />
                  <p className="text-sm">Aucune photo — un icône générique s&apos;affichera</p>
                </div>
              )}
              {/* Overlay gradient like the customer app */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3">
                <p className="text-white font-bold text-lg drop-shadow">{restaurant?.name}</p>
                {restaurant?.address && (
                  <p className="text-white/70 text-xs drop-shadow">{restaurant.address}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500">
              La photo de couverture est prioritaire. Si absente, le logo est utilisé.
            </p>
          </div>

          {/* ── Info edit ──────────────────────────────────────────────────── */}
          <div className="card card-inner space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Informations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Nom du restaurant</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setInfoEdited(true); }}
                  disabled={infoMutation.isPending}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setInfoEdited(true); }}
                  rows={2}
                  disabled={infoMutation.isPending}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Adresse</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setInfoEdited(true); }}
                  disabled={infoMutation.isPending}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setInfoEdited(true); }}
                  disabled={infoMutation.isPending}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>
            {infoEdited && (
              <button
                type="button"
                onClick={() => infoMutation.mutate()}
                disabled={infoMutation.isPending || !name.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                <Save size={15} />
                {infoMutation.isPending ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
