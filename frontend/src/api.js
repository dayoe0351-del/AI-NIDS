import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 5000,
});

export const fetchIncidents = () => api.get('/incidents/');
export const fetchFlows = () => api.get('/flows/');
export const fetchResponses = () => api.get('/responses/');

export default api;
