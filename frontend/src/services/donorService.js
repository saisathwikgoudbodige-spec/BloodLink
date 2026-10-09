import api from './api';

export const donorService = {
  getProfile: () => api.get('/donors/profile'),
  updateProfile: (data) => api.put('/donors/profile', data),
  updateAvailability: (availabilityStatus) => api.patch('/donors/availability', { availabilityStatus }),
  getDonorMatches: () => api.get('/donors/matches'),
};

export default donorService;
