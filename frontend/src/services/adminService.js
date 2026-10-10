import api from './api';

export const adminService = {
  getSummary: () => api.get('/admin/summary'),
  getAllUsers: () => api.get('/admin/users'),
  getPendingUsers: () => api.get('/admin/users/pending'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  approveUser: (id) => api.post(`/admin/users/${id}/approve`),
  rejectUser: (id, reason) => api.post(`/admin/users/${id}/reject`, { reason }),
  toggleUserStatus: (id, active) => api.patch(`/admin/users/${id}/status?active=${active}`),
  getAllRequests: () => api.get('/admin/requests'),
  getFilteredRequests: (params) => api.get('/admin/requests', { params }),
  updateRequestStatus: (id, status, reason) => api.patch(`/admin/requests/${id}/status`, { status, reason }),
  getPotentialDuplicates: (requestId) => api.get(`/admin/requests/${requestId}/duplicates`),
  getAuditLogs: () => api.get('/admin/audit-logs'),
};

export default adminService;
