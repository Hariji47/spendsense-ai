import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:8000/api' : '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getDashboardStats = (timeframe = 'all') => api.get(`/dashboard/stats?timeframe=${timeframe}`);

export const getTransactions = (timeframe = 'all', skip = 0, limit = 100) => 
  api.get(`/transactions/?timeframe=${timeframe}&skip=${skip}&limit=${limit}`);

export const createTransaction = (transaction) => 
  api.post('/transactions/', transaction);

export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);
export const deleteAllTransactions = () => api.delete('/transactions/all');

export const uploadCsv = (formData) => 
  api.post('/transactions/upload/validate', formData);

export const confirmUpload = (records) => 
  api.post('/transactions/upload/confirm', records);

export const getAnalyticsCharts = (timeframe = 'all') => 
  api.get(`/analytics/charts?timeframe=${timeframe}`);
export const getAnalyticsInsights = () => api.get('/analytics/insights');
export const generateTaxReport = () => api.get('/analytics/tax-report', { responseType: 'blob' });

export const predictCategory = (description) => 
  api.post('/ai/predict-category', { description });

export const getAnomalies = () => api.get('/ai/anomalies');

export const getForecast = () => api.get('/ai/forecast');

export const trainModels = () => api.post('/ai/train');

export const sendChatMessage = (message) => api.post('/ai/chat', { message });

export const getSubscriptions = () => api.get('/subscriptions/');

export const getSettings = () => api.get('/settings/');
export const updateSettings = (data) => api.put('/settings/', data);

export const exportTransactions = () => 
  api.get('/transactions/export', { responseType: 'blob' });

// Auth endpoints
export const login = (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  return api.post('/auth/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
};

export const register = (email, password, full_name) => 
  api.post('/auth/register', { email, password, full_name });
export const getMe = () => api.get('/auth/me');
export const deleteAccount = () => api.delete('/auth/me');
export const changePassword = (current_password, new_password) =>
  api.post('/auth/change-password', { current_password, new_password });

export const uploadProfilePicture = (formData) => 
  api.post('/auth/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export default api;
