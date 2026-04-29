import { api } from './client';

export type TableStatus = 'free' | 'occupied' | 'reserved' | 'to_clear';

export interface FloorTable {
  id: string;
  name: string;
  seats: number;
  x: number;
  y: number;
  status: TableStatus;
}

export interface Floor {
  id: string;
  name: string;
  tables: FloorTable[];
}

export interface FloorPlanData {
  restaurant_id: string;
  floors: Floor[];
  updated_at?: string | null;
}

export const floorApi = {
  get: (): Promise<FloorPlanData> =>
    api.get('/owner/floor-plan').then((r) => r.data),

  save: (floors: Floor[]): Promise<FloorPlanData> =>
    api.put('/owner/floor-plan', { floors }).then((r) => r.data),
};
