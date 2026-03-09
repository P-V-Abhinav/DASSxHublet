import axios from 'axios';

// Reads from .env / Vercel environment variables at build time.
// Set VITE_API_BASE_URL=https://project-monorepo-team-46.onrender.com/api for production.
// Set VITE_API_BASE_URL=http://localhost:3000/api for local development.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Buyers
export const buyerApi = {
  create: (data: any) => api.post('/buyers', data),
  getAll: () => api.get('/buyers'),
  getById: (id: string) => api.get(`/buyers/${id}`),
  update: (id: string, data: any) => api.put(`/buyers/${id}`, data),
  delete: (id: string) => api.delete(`/buyers/${id}`),
};

// Sellers
export const sellerApi = {
  create: (data: any) => api.post('/sellers', data),
  getAll: () => api.get('/sellers'),
  getById: (id: string) => api.get(`/sellers/${id}`),
  update: (id: string, data: any) => api.put(`/sellers/${id}`, data),
  delete: (id: string) => api.delete(`/sellers/${id}`),
};

// Properties
export const propertyApi = {
  create: (data: any) => api.post('/properties', data),
  getAll: (params?: any) => api.get('/properties', { params }),
  getById: (id: string) => api.get(`/properties/${id}`),
  update: (id: string, data: any) => api.put(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
};

// Matching
export const matchingApi = {
  findForBuyer: (buyerId: string, params?: any) => 
    api.post(`/matches/buyer/${buyerId}/find`, null, { params }),
  findForProperty: (propertyId: string, params?: any) => 
    api.post(`/matches/property/${propertyId}/find`, null, { params }),
  getForBuyer: (buyerId: string) => api.get(`/matches/buyer/${buyerId}`),
  getForProperty: (propertyId: string) => api.get(`/matches/property/${propertyId}`),
};

// Leads
export const leadApi = {
  create: (data: any) => api.post('/leads', data),
  getAll: (params?: any) => api.get('/leads', { params }),
  getById: (id: string) => api.get(`/leads/${id}`),
  transition: (id: string, toState: string) => 
    api.post(`/leads/${id}/transition`, { toState }),
  getAllowedStates: (id: string) => api.get(`/leads/${id}/allowed-states`),
};

export default api;
