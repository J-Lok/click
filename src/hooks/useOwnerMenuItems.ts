import { useQuery } from '@tanstack/react-query';
import { menusOwnerApi } from '../api/menusOwner';

export function useOwnerMenuItems(restaurantId: string | null) {
  return useQuery({
    queryKey: ['owner-menu', restaurantId],
    queryFn: () => menusOwnerApi.getMenu(restaurantId!).then((r) => r.data),
    enabled: !!restaurantId,
  });
}
