import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRestaurantStore } from '../../store/restaurantStore';
import { useOwnerMenuItems } from '../../hooks/useOwnerMenuItems';
import {
  menusOwnerApi,
  type MenuItemCreateOwner,
  type MenuItemUpdateOwner,
} from '../../api/menusOwner';
import { filesApi } from '../../api/files';
import { useToast } from '../../shared/components/ToastProvider';
import { getApiErrorMessage } from '../../lib/apiError';
import { Utensils, Plus, Pencil, Trash2, Camera, X, ImageOff } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)
  ?? (import.meta.env.DEV ? 'http://localhost:8000' : '');

function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

interface MenuItemRow {
  id: string;
  name: string;
  price?: number;
  category?: string;
  description?: string;
  is_available?: boolean;
  preparation_time?: number;
  image_url?: string | null;
}

interface FormValues {
  name: string;
  description: string;
  price: number;
  category: string;
  preparation_time: number;
}

// ── Image picker ──────────────────────────────────────────────────────────────

function ImagePicker({
  current,
  onChange,
  onRemove,
  disabled,
}: {
  current?: string | null;
  onChange: (file: File, preview: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(
    current ? resolveImageUrl(current) : undefined
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file, url);
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-700 border-2 border-dashed border-slate-500 flex items-center justify-center cursor-pointer hover:border-emerald-500 transition-colors shrink-0"
        onClick={() => !disabled && inputRef.current?.click()}
        title="Changer la photo"
      >
        {preview ? (
          <>
            <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
          </>
        ) : (
          <Camera size={20} className="text-slate-500" />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          disabled={disabled}
          className="text-xs px-3 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-slate-200 transition-colors disabled:opacity-50"
        >
          {preview ? 'Changer la photo' : 'Ajouter une photo'}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => {
              setPreview(undefined);
              onRemove();
              if (inputRef.current) inputRef.current.value = '';
            }}
            disabled={disabled}
            className="text-xs px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/60 text-red-400 transition-colors disabled:opacity-50"
          >
            Supprimer la photo
          </button>
        )}
        <p className="text-xs text-slate-500">JPG, PNG, WEBP · max 5 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
        disabled={disabled}
      />
    </div>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────

function MenuItemFormModal({
  title,
  initial,
  categories,
  loading,
  error,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: FormValues & { image_url?: string | null };
  categories: string[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: FormValues, imageFile: File | null, removeImage: boolean) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [price, setPrice] = useState(String(initial.price));
  const [prepTime, setPrepTime] = useState(String(initial.preparation_time));
  const [category, setCategory] = useState(
    categories.includes(initial.category) ? initial.category : ''
  );
  const [customCategory, setCustomCategory] = useState(
    initial.category && !categories.includes(initial.category) ? initial.category : ''
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const effectiveCategory = category || customCategory;
  const canSubmit = name.trim() && effectiveCategory.trim() && Number(price) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="card w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-inner flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 id="modal-title" className="text-lg font-semibold text-white">{title}</h3>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Image */}
          <div>
            <label className="block text-xs text-slate-400 mb-2">Photo du plat (optionnel)</label>
            <ImagePicker
              current={removeImage ? null : initial.image_url}
              onChange={(file) => { setImageFile(file); setRemoveImage(false); }}
              onRemove={() => { setImageFile(null); setRemoveImage(true); }}
              disabled={loading}
            />
          </div>

          <form
            id="menu-item-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canSubmit) return;
              onSubmit(
                {
                  name: name.trim(),
                  description: description.trim(),
                  price: Number(price) || 0,
                  category: effectiveCategory.trim(),
                  preparation_time: Number(prepTime) || 15,
                },
                imageFile,
                removeImage
              );
            }}
            className="space-y-3"
          >
            <div>
              <label htmlFor="item-name" className="block text-xs text-slate-400 mb-1">
                Nom <span className="text-red-400">*</span>
              </label>
              <input
                id="item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="item-desc" className="block text-xs text-slate-400 mb-1">
                Description (optionnel)
              </label>
              <textarea
                id="item-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="item-price" className="block text-xs text-slate-400 mb-1">
                  Prix (F) <span className="text-red-400">*</span>
                </label>
                <input
                  id="item-price"
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="item-prep" className="block text-xs text-slate-400 mb-1">
                  Préparation (min)
                </label>
                <input
                  id="item-prep"
                  type="number"
                  min={1}
                  max={180}
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="item-category" className="block text-xs text-slate-400 mb-1">
                Catégorie <span className="text-red-400">*</span>
              </label>
              {categories.length > 0 && (
                <select
                  id="item-category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    if (e.target.value) setCustomCategory('');
                  }}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 text-sm mb-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                >
                  <option value="">— Nouvelle catégorie —</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
              {!category && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Nom de la nouvelle catégorie"
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}
          </form>
        </div>

        <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="menu-item-form"
            disabled={loading || !canSubmit}
            className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function MenuPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const queryClient = useQueryClient();
  const addToast = useToast();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemRow | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: rawItems, isLoading, isError, error } = useOwnerMenuItems(restaurantId);
  const list = Array.isArray(rawItems) ? (rawItems as MenuItemRow[]) : [];
  const filteredList = list.filter((i) => {
    if (categoryFilter && i.category !== categoryFilter) return false;
    if (availableOnly && i.is_available === false) return false;
    return true;
  });
  const categories = Array.from(new Set(list.map((i) => i.category).filter(Boolean))) as string[];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['owner-menu', restaurantId] });

  // Upload image after item ID is known
  const uploadImage = async (itemId: string, file: File) => {
    try {
      const res = await filesApi.uploadMenuPhoto(itemId, file);
      return res.data.photo_url;
    } catch (e) {
      addToast('Photo non sauvegardée : ' + getApiErrorMessage(e), 'error');
      return null;
    }
  };

  const deleteImage = async (itemId: string) => {
    try {
      await filesApi.deleteMenuPhoto(itemId);
    } catch {
      // non-blocking
    }
  };

  const createMutation = useMutation({
    mutationFn: async ({
      data,
      imageFile,
    }: {
      data: MenuItemCreateOwner;
      imageFile: File | null;
    }) => {
      const item = await menusOwnerApi.createItem(restaurantId!, data).then((r) => r.data as MenuItemRow);
      if (imageFile) {
        const photoUrl = await uploadImage(item.id, imageFile);
        if (photoUrl) {
          await menusOwnerApi.updateItem(restaurantId!, item.id, { image_url: photoUrl });
        }
      }
      return item;
    },
    onSuccess: () => {
      invalidate();
      setCreating(false);
      addToast('Plat ajouté avec succès', 'success');
    },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      itemId,
      data,
      imageFile,
      removeImage,
    }: {
      itemId: string;
      data: MenuItemUpdateOwner;
      imageFile: File | null;
      removeImage: boolean;
    }) => {
      if (imageFile) {
        const photoUrl = await uploadImage(itemId, imageFile);
        if (photoUrl) data = { ...data, image_url: photoUrl };
      } else if (removeImage) {
        await deleteImage(itemId);
        data = { ...data, image_url: null };
      }
      return menusOwnerApi.updateItem(restaurantId!, itemId, data).then((r) => r.data);
    },
    onSuccess: () => {
      invalidate();
      setEditingItem(null);
      addToast('Plat mis à jour', 'success');
    },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => menusOwnerApi.deleteItem(restaurantId!, itemId),
    onSuccess: () => {
      invalidate();
      addToast('Plat supprimé', 'success');
    },
    onError: (err) => addToast(getApiErrorMessage(err), 'error'),
  });

  const toggleAvailability = (item: MenuItemRow) => {
    updateMutation.mutate({
      itemId: item.id,
      data: { is_available: item.is_available === false },
      imageFile: null,
      removeImage: false,
    });
  };

  if (!restaurantId) {
    return (
      <div className="card card-inner bg-amber-500/10 border-amber-500/30 text-amber-200 text-sm">
        Aucun restaurant sélectionné.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Menu / Produits</h2>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 text-sm"
            aria-label="Filtrer par catégorie"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 accent-emerald-500"
            />
            Disponibles uniquement
          </label>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
        >
          <Plus size={18} />
          Ajouter un plat
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-32 bg-slate-700 rounded-t-xl" />
              <div className="card-inner space-y-2">
                <div className="h-4 bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm py-6 space-y-2">
          <p>{getApiErrorMessage(error)}</p>
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['owner-menu', restaurantId] })}
            className="underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="card card-inner flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
          <Utensils size={48} className="opacity-60" />
          <p className="text-center">
            {list.length === 0 ? 'Aucun plat dans le menu' : 'Aucun plat ne correspond aux filtres'}
          </p>
          {list.length === 0 && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
            >
              Ajouter un premier plat
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">{filteredList.length} plat(s)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((item) => {
              const imgUrl = resolveImageUrl(item.image_url);
              return (
                <div key={item.id} className="card flex flex-col overflow-hidden">
                  {/* Image zone */}
                  <div className="relative h-36 bg-slate-700/60 flex items-center justify-center shrink-0">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <ImageOff size={28} className="text-slate-600" />
                    )}
                    {/* Availability badge */}
                    <span
                      className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.is_available !== false
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-slate-600/90 text-slate-300'
                      }`}
                    >
                      {item.is_available !== false ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="card-inner flex flex-col gap-2 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="font-medium text-white truncate">{item.name}</h3>
                        {item.category && (
                          <span className="text-xs text-slate-500 uppercase tracking-wide">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-emerald-400 shrink-0 whitespace-nowrap">
                        {(item.price ?? 0).toLocaleString('fr-FR')} F
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>
                    )}
                    {item.preparation_time != null && (
                      <p className="text-xs text-slate-500">⏱ {item.preparation_time} min</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/60 mt-auto">
                      <button
                        type="button"
                        onClick={() => toggleAvailability(item)}
                        disabled={updateMutation.isPending}
                        className="text-xs px-2 py-1 rounded bg-slate-600 hover:bg-slate-500 text-slate-200 transition-colors disabled:opacity-50"
                      >
                        {item.is_available !== false ? 'Désactiver' : 'Activer'}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 rounded bg-slate-600 hover:bg-slate-500 text-slate-300 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Supprimer « ${item.name} » ?`)) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create modal */}
      {creating && (
        <MenuItemFormModal
          title="Ajouter un plat"
          initial={{ name: '', description: '', price: 0, category: '', preparation_time: 15, image_url: null }}
          categories={categories}
          loading={createMutation.isPending}
          error={createMutation.isError ? getApiErrorMessage(createMutation.error) : null}
          onClose={() => { setCreating(false); createMutation.reset(); }}
          onSubmit={(data, imageFile) => {
            createMutation.mutate({
              data: {
                name: data.name,
                description: data.description || undefined,
                price: Number(data.price) || 0,
                category: data.category,
                preparation_time: data.preparation_time || 15,
              },
              imageFile,
            });
          }}
        />
      )}

      {/* Edit modal */}
      {editingItem && (
        <MenuItemFormModal
          title="Modifier le plat"
          initial={{
            name: editingItem.name,
            description: editingItem.description ?? '',
            price: editingItem.price ?? 0,
            category: editingItem.category ?? '',
            preparation_time: editingItem.preparation_time ?? 15,
            image_url: editingItem.image_url,
          }}
          categories={categories}
          loading={updateMutation.isPending}
          error={updateMutation.isError ? getApiErrorMessage(updateMutation.error) : null}
          onClose={() => { setEditingItem(null); updateMutation.reset(); }}
          onSubmit={(data, imageFile, removeImage) => {
            updateMutation.mutate({
              itemId: editingItem.id,
              data: {
                name: data.name,
                description: data.description || undefined,
                price: Number(data.price) || 0,
                category: data.category,
                preparation_time: data.preparation_time || undefined,
              },
              imageFile,
              removeImage,
            });
          }}
        />
      )}
    </div>
  );
}
