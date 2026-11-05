import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Auth interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data: { email: string; full_name: string; password: string }) =>
    apiClient.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  me: () => apiClient.get('/auth/me'),
};

export const imageAPI = {
  removeBg: (file: File, intensity = 100) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('intensity', intensity.toString());
    return apiClient.post('/image/remove-bg', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  upscale: (file: File, scale = 2) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post(`/image/upscale?scale=${scale}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  enhance: (file: File, intensity = 50, deductCredit = false) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('intensity', intensity.toString());
    return apiClient.post(`/image/enhance?intensity=${intensity}&deduct_credit=${deductCredit}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  batchProcess: (files: File[], operation = 'remove-bg') => {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    return apiClient.post(`/image/batch-process?operation=${operation}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ✅ NEW Gemini‑based generation API
export const generationAPI = {
  textToImage: (data: { prompt: string; num_images?: number }) =>
    apiClient.post('/generate/text-to-image', data),
  imageToImage: (file: File, prompt: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('prompt', prompt);
    return apiClient.post('/generate/image-to-image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // (optional) keep old endpoint for compatibility
  generate: (data: { prompt: string; num_images?: number }) =>
    apiClient.post('/generate/from-prompt', data),
};
