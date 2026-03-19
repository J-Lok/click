import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RestaurantState {
  currentRestaurantId: string | null;
  setCurrentRestaurantId: (id: string | null) => void;
  reset: () => void;
}

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set) => ({
      currentRestaurantId: import.meta.env.VITE_DEFAULT_RESTAURANT_ID ?? null,
      setCurrentRestaurantId: (id) => set({ currentRestaurantId: id }),
      reset: () => set({ currentRestaurantId: null }),
    }),
    { name: 'restaurant' }
  )
);