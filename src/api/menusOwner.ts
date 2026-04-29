import { api } from './client';

export interface MenuItemCreateOwner {
  name: string;
  description?: string;
  price: number;
  category: string;
  category_id?: string;
  image_url?: string | null;
  preparation_time?: number;
  stock_quantity?: number;
  low_stock_alert?: number;
  is_featured?: boolean;
  is_special?: boolean;
}

export interface MenuItemUpdateOwner {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  image_url?: string | null;
  preparation_time?: number;
  stock_quantity?: number;
  low_stock_alert?: number;
  is_available?: boolean;
  is_featured?: boolean;
  is_special?: boolean;
}

export const menusOwnerApi = {
  getMenu: (restaurantId: string) =>
    api.get(`/menus/owner/restaurants/${restaurantId}/menu`),
  getLowStock: (restaurantId: string) =>
    api.get(`/menus/owner/restaurants/${restaurantId}/menu/low-stock`),
  createItem: (restaurantId: string, data: MenuItemCreateOwner) =>
    api.post(`/menus/owner/restaurants/${restaurantId}/menu/items`, data),
  updateItem: (
    restaurantId: string,
    itemId: string,
    data: MenuItemUpdateOwner
  ) =>
    api.put(`/menus/owner/restaurants/${restaurantId}/menu/items/${itemId}`, data),
  deleteItem: (restaurantId: string, itemId: string) =>
    api.delete(`/menus/owner/restaurants/${restaurantId}/menu/items/${itemId}`),
};
