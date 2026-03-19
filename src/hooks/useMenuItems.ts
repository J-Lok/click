import { useQuery } from '@tanstack/react-query';
import { menuItemsApi } from '../api/menuItems';

export function useMenuItems(
  restaurantId: string | null,
  params?: { category?: string; available_only?: boolean }
) {
  return useQuery({
    queryKey: ['menu-items', restaurantId, params],
    queryFn: () => menuItemsApi.listByRestaurant(restaurantId!, params).then((r) => r.data),
    enabled: !!restaurantId,
  });
}
