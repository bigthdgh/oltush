import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token from Telegram initData if available
api.interceptors.request.use((config) => {
  if (window.Telegram?.WebApp?.initData) {
    config.headers['X-Telegram-Init-Data'] = window.Telegram.WebApp.initData;
  }
  const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (userId) {
    config.headers['X-Telegram-ID'] = String(userId);
  }
  return config;
});

export const fetchItems = () => api.get('/items');
export const fetchItem = (id) => api.get(`/items/${id}`);
export const fetchBusyDates = (itemId, month) => api.get(`/bookings/busy?item_id=${itemId}&month=${month}`);
export const createBooking = (data) => api.post('/bookings/create', data);
export const createPayment = (bookingId) => api.post('/payments/create', { booking_id: bookingId });

export const fetchMyBookings = (userId) => api.get(`/bookings/my?user_id=${userId}`);
export const cancelBooking = (id) => api.post(`/bookings/${id}/cancel`);

export const checkAdmin = (userId) => api.get(`/me?user_id=${userId}`);

export const fetchAdminBookings = (month) => api.get(`/admin/bookings?month=${month}`);
export const fetchAllBookings = () => api.get('/admin/bookings/all');
export const createManualBooking = (data) => api.post('/admin/bookings/manual', data);
export const adminUpdateBooking = (id, data) => api.put(`/admin/bookings/${id}`, data);
export const adminCancelBooking = (id) => api.post(`/admin/bookings/${id}/cancel`);
export const fetchAllCustomers = () => api.get('/admin/customers');
export const fetchAllItems = () => api.get('/admin/items/all');
export const updateItem = (id, data) => api.put(`/admin/items/${id}`, data);

export default api;
