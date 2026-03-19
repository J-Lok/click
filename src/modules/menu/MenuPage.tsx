import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRestaurantStore } from '../../store/restaurantStore';
import { useMenuItems } from '../../hooks/useMenuItems';
import {
  menusOwnerApi,
  type MenuItemCreateOwner,
  type MenuItemUpdateOwner,
} from '../../api/menusOwner';
import { Utensils, Plus, Pencil, Trash2 } from 'lucide-react';

interface MenuItemRow {
  id: string;
  name: string;
  price?: number;
  category?: string;
  description?: string;
  is_available?: boolean;
  preparation_time?: number;
}

export function MenuPage() {
  const restaurantId = useRestaurantStore((s) => s.currentRestaurantId);
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemRow | null>(null);
  const [creating, setCreating] = useState(false);

  // Affichage principal via endpoint public /menu-items/restaurant/{id}/menu
  const {
    data: publicItems,
    isLoading,
    isError,
  } = useMenuItems(restaurantId, {
    category: category || undefined,
    available_only: availableOnly,
  });

  const list = Array.isArray(publicItems)
    ? (publicItems as MenuItemRow[])
    : [];

  const filteredList = list.filter((i) => {
    if (category && i.category !== category) return false;
    if (availableOnly && i.is_available === false) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: (data: MenuItemCreateOwner) =>
      menusOwnerApi.createItem(restaurantId!, data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-menu', restaurantId] });
      setCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: MenuItemUpdateOwner;
    }) =>
      menusOwnerApi
        .updateItem(restaurantId!, itemId, data)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-menu', restaurantId] });
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) =>
      menusOwnerApi.deleteItem(restaurantId!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-menu', restaurantId] });
      setEditingItem(null);
    },
  });

  const categories = Array.from(
    new Set(list.map((i) => i.category).filter(Boolean))
  ) as string[];

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
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Menu / Produits</h2>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-slate-300 text-sm">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700"
            />
            Disponibles uniquement
          </label>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
        >
          <Plus size={18} />
          Ajouter un plat
        </button>
      </div>

      {isLoading ? (
        <div className="card card-inner text-center text-slate-400 py-12">
          Chargement...
        </div>
      ) : isError ? (
        <div className="card card-inner bg-red-500/10 border-red-500/30 text-red-300 text-sm py-6">
          Erreur lors du chargement du menu.
        </div>
      ) : filteredList.length === 0 ? (
        <div className="card card-inner flex flex-col items-center justify-center gap-2 text-slate-400 py-12">
          <Utensils size={40} />
          <p>
            {list.length === 0
              ? 'Aucun plat dans le menu'
              : 'Aucun plat ne correspond aux filtres'}
          </p>
          {list.length === 0 && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="text-emerald-400 hover:underline text-sm"
            >
              Ajouter un plat
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="card card-inner flex flex-col"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-white">{item.name}</h3>
                  {item.category && (
                    <span className="text-xs text-slate-500">{item.category}</span>
                  )}
                </div>
                <span className="font-semibold text-emerald-400">
                  {(item.price ?? 0).toLocaleString()} FCFA
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    item.is_available !== false
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-600 text-slate-400'
                  }`}
                >
                  {item.is_available !== false ? 'Disponible' : 'Indisponible'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateMutation.mutate({
                        itemId: item.id,
                        data: {
                          is_available: !(item.is_available !== false),
                        },
                      })
                    }
                    disabled={updateMutation.isPending}
                    className="text-xs px-2 py-1 rounded bg-slate-600 hover:bg-slate-500 text-slate-200"
                  >
                    {item.is_available !== false ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="p-1.5 rounded bg-slate-600 hover:bg-slate-500 text-slate-300"
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Supprimer « ${item.name } » ?`)) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création */}
      {creating && (
        <MenuItemFormModal
          title="Ajouter un plat"
          initial={{ name: '', description: '', price: 0, category: '' }}
          categories={categories}
          loading={createMutation.isPending}
          error={createMutation.isError ? 'Erreur lors de la création' : null}
          onClose={() => setCreating(false)}
          onSubmit={(data) => {
            createMutation.mutate({
              name: data.name,
              description: data.description || undefined,
              price: Number(data.price) || 0,
              category: data.category,
              preparation_time: 15,
            });
          }}
        />
      )}

      {/* Modal Édition */}
      {editingItem && (
        <MenuItemFormModal
          title="Modifier le plat"
          initial={{
            name: editingItem.name,
            description: editingItem.description ?? '',
            price: editingItem.price ?? 0,
            category: editingItem.category ?? '',
          }}
          categories={categories}
          loading={updateMutation.isPending}
          error={updateMutation.isError ? 'Erreur lors de la mise à jour' : null}
          onClose={() => setEditingItem(null)}
          onSubmit={(data) => {
            updateMutation.mutate({
              itemId: editingItem.id,
              data: {
                name: data.name,
                description: data.description || undefined,
                price: Number(data.price) || 0,
                category: data.category,
              },
            });
          }}
        />
      )}
    </div>
  );
}

interface FormValues {
  name: string;
  description: string;
  price: number;
  category: string;
}

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
  initial: FormValues;
  categories: string[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: FormValues) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [price, setPrice] = useState(String(initial.price));
  const [category, setCategory] = useState(initial.category);
  const [customCategory, setCustomCategory] = useState(
    initial.category && !categories.includes(initial.category)
      ? initial.category
      : ''
  );

  const effectiveCategory = category || customCategory;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !effectiveCategory.trim()) return;
            onSubmit({
              name: name.trim(),
              description: description.trim(),
              price: Number(price) || 0,
              category: effectiveCategory.trim(),
            });
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-xs text-slate-500 mb-1">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Prix (FCFA)</label>
            <input
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Catégorie</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (e.target.value) setCustomCategory('');
              }}
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 text-sm mb-1"
            >
              <option value="">— Nouvelle catégorie ci-dessous —</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {(!category || customCategory) && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Nom de la catégorie"
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
              />
            )}
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !effectiveCategory.trim()}
              className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
