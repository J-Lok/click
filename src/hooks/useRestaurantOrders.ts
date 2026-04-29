import { useQuery } from '@tanstack/react-query';
import { restaurantsApi } from '../api/restaurants';

export function useRestaurantOrders(
  restaurantId: string | null,
  params?: { status?: string; page?: number; page_size?: number }
) {
  return useQuery({
    queryKey: ['restaurant-orders', restaurantId, params],
    queryFn: () => restaurantsApi.getOrders(restaurantId!, params).then((r) => r.data),
    enabled: !!restaurantId,
  });
}

export function usePendingOrders(restaurantId: string | null) {
  return useQuery({
    queryKey: ['restaurant-pending-orders', restaurantId],
    queryFn: () => restaurantsApi.getPendingOrders(restaurantId!).then((r) => r.data),
    enabled: !!restaurantId,
  });
}
