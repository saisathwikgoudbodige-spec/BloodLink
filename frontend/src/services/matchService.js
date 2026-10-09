import api from './api';

export const matchService = {
  getMyMatches: () => api.get('/matches/my'),
  respondToMatch: (id, response) => api.patch(`/matches/${id}/respond`, { response }),
};

export default matchService;
