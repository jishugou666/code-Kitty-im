import apiClient from './client';

export const uploadApi = {
  uploadImage: (imageData: string) => {
    return apiClient.post<{ url: string; display_url: string }>('/upload/image', { image: imageData });
  }
};
