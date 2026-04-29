import { useQuery } from '@tanstack/react-query';
import { restaurantsApi } from '../api/restaurants';

export function useRestaurantStatistics(
  restaurantId: string | null,
  params?: { period?: string; start_date?: string; end_date?: string }
) {
  return useQuery({
    queryKey: ['restaurant-statistics', restaurantId, params],
    queryFn: () => restaurantsApi.getStatistics(restaurantId!, params).then((r) => r.data),
    enabled: !!restaurantId,
  });
}
