import api from './api';

export const requestService = {
  createRequest: (data) => api.post('/requests', data),
  getAllRequests: (activeOnly = false) => api.get(`/requests?activeOnly=${activeOnly}`),
  getMyRequests: () => api.get('/requests/my'),
  getRequestById: (id) => api.get(`/requests/${id}`),
  updateRequest: (id, data) => api.put(`/requests/${id}`, data),
  updateStatus: (id, status, reason = '') => api.patch(`/requests/${id}/status`, { status, reason }),
  deleteRequest: (id) => api.delete(`/requests/${id}`),
  getMatchesForRequest: (id) => api.get(`/requests/${id}/matches`),
};

export default requestService;
