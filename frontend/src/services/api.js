import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Themes ----
export const themeApi = {
  getAll: () => api.get('/themes'),
  get: (id) => api.get(`/themes/${id}`),
  create: (data) => api.post('/themes', data),
  update: (id, data) => api.put(`/themes/${id}`, data),
  delete: (id) => api.delete(`/themes/${id}`),
};

// ---- Nodes ----
export const nodeApi = {
  getByTheme: (themeId) => api.get(`/nodes/theme/${themeId}`),
  get: (id) => api.get(`/nodes/${id}`),
  create: (data) => api.post('/nodes', data),
  batchCreate: (nodes) => api.post('/nodes/batch', { nodes }),
  update: (id, data) => api.put(`/nodes/${id}`, data),
  batchPositions: (positions) => api.put('/nodes/batch/positions', { positions }),
  delete: (id) => api.delete(`/nodes/${id}`),
};

// ---- Edges ----
export const edgeApi = {
  getByTheme: (themeId) => api.get(`/edges/theme/${themeId}`),
  create: (data) => api.post('/edges', data),
  batchCreate: (edges) => api.post('/edges/batch', { edges }),
  delete: (id) => api.delete(`/edges/${id}`),
};

// ---- Feeds ----
export const feedApi = {
  getByTheme: (themeId) => api.get(`/feeds/theme/${themeId}`),
  feed: (data) => api.post('/feeds', data),
};

// ---- Comments ----
export const commentApi = {
  getByTheme: (themeId) => api.get(`/comments/theme/${themeId}`),
  getByNode: (nodeId) => api.get(`/comments/node/${nodeId}`),
  create: (data) => api.post('/comments', data),
  delete: (id) => api.delete(`/comments/${id}`),
};

// ---- Snapshots ----
export const snapshotApi = {
  getByTheme: (themeId) => api.get(`/snapshots/theme/${themeId}`),
  get: (id) => api.get(`/snapshots/${id}`),
};

// ---- Analyses ----
export const analysisApi = {
  getByTheme: (themeId) => api.get(`/analyses/theme/${themeId}`),
  getAllByTheme: (themeId) => api.get(`/analyses/theme/${themeId}/all`),
  getByNode: (nodeId) => api.get(`/analyses/node/${nodeId}`),
  generateNode: (nodeId, regenerate = false) => api.post(`/analyses/generate/node/${nodeId}`, { regenerate }),
  generateTheme: (themeId, regenerate = false) => api.post(`/analyses/generate/theme/${themeId}`, { regenerate }),
  generateAll: (themeId) => api.post(`/analyses/generate/theme/${themeId}/all`, {}),
};

export default api;
