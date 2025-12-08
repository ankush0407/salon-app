import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  registerSalon: (name, email, phone, address, password) => 
    api.post('/auth/register-salon', { name, email, phone, address, password }),
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
};

export const customersAPI = {
  getAll: () => api.get('/customers'),
  create: (customerData) => api.post('/customers', customerData),
  getById: (id) => api.get(`/customers/${id}`),
  update: (id, customerData) => api.put(`/customers/${id}`, customerData),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const subscriptionsAPI = {
  getByCustomer: (customerId) => api.get(`/subscriptions/customer/${customerId}`),
  create: (subscriptionData) => api.post('/subscriptions', subscriptionData),
  redeemVisit: (subscriptionId, note) => api.post(`/subscriptions/${subscriptionId}/redeem`, { note }),
  updateVisitNote: (subscriptionId, visitId, note) => api.put(`/subscriptions/visit/${visitId}`, { note }),
  deleteVisit: (subscriptionId, visitId) => api.delete(`/subscriptions/visit/${visitId}`),
};

export const subscriptionTypesAPI = {
  getAll: () => api.get('/subscription-types'),
  create: (typeData) => api.post('/subscription-types', typeData),
  delete: (typeId) => api.delete(`/subscription-types/${typeId}`),
};

export default api;