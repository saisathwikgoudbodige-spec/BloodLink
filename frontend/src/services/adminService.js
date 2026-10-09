import api from './api';

export const adminService = {
  getAllUsers: () => api.get('/admin/users'),
  toggleUserStatus: (id, active) => api.patch(`/admin/users/${id}/status?active=${active}`),
  getAllRequests: () => api.get('/admin/requests'),
  getPotentialDuplicates: (requestId) => api.get(`/admin/requests/${requestId}/duplicates`),
  getAuditLogs: () => api.get('/admin/audit-logs'),
};

export default adminService;
