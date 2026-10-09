import api from './api';

export const dashboardService = {
  getRequesterDashboard: () => api.get('/dashboard/requester'),
  getDonorDashboard: () => api.get('/dashboard/donor'),
  getAdminDashboard: () => api.get('/dashboard/admin'),
};

export default dashboardService;
