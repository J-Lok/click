import { api } from './client';

const multipart = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return { data: form, headers: { 'Content-Type': 'multipart/form-data' } };
};

export const filesApi = {
  // Menu item photo
  uploadMenuPhoto: (itemId: string, file: File) => {
    const { data, headers } = multipart(file);
    return api.post<{ photo_url: string; thumbnail_url: string }>(
      `/files/upload/menu/${itemId}/photo`,
      data,
      { headers }
    );
  },
  deleteMenuPhoto: (itemId: string) =>
    api.delete(`/files/menu/${itemId}/photo`),

  // Restaurant logo
  uploadRestaurantLogo: (restaurantId: string, file: File) => {
    const { data, headers } = multipart(file);
    return api.post<{ logo_url: string; thumbnail_url: string }>(
      `/files/upload/restaurant/${restaurantId}/logo`,
      data,
      { headers }
    );
  },
  deleteRestaurantLogo: (restaurantId: string) =>
    api.delete(`/files/restaurant/${restaurantId}/logo`),

  // Restaurant cover photo
  uploadRestaurantCover: (restaurantId: string, file: File) => {
    const { data, headers } = multipart(file);
    return api.post<{ cover_url: string; thumbnail_url: string }>(
      `/files/upload/restaurant/${restaurantId}/cover`,
      data,
      { headers }
    );
  },
  deleteRestaurantCover: (restaurantId: string) =>
    api.delete(`/files/restaurant/${restaurantId}/cover`),
};
