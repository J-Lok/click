import { useQuery } from '@tanstack/react-query';
import { menusOwnerApi } from '../api/menusOwner';

export function useLowStock(restaurantId: string | null) {
  return useQuery({
    queryKey: ['menu-low-stock', restaurantId],
    queryFn: () => menusOwnerApi.getLowStock(restaurantId!).then((r) => r.data),
    enabled: !!restaurantId,
  });
}
