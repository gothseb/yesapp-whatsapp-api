import axios from 'axios';

// Base URL for API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// API Key - In production, this should come from env or user input
// For dev, you need to set it after first backend startup
const API_KEY = import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add API key
apiClient.interceptors.request.use(
  (config) => {
    if (API_KEY && API_KEY !== 'YOUR_API_KEY_HERE') {
      config.headers['X-API-Key'] = API_KEY;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // No response received
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * API Client Methods
 */
const api = {
  // Sessions
  getSessions: () => apiClient.get('/sessions'),
  
  getSession: (id) => apiClient.get(`/sessions/${id}`),
  
  createSession: (name) => apiClient.post('/sessions', { name }),
  
  deleteSession: (id) => apiClient.delete(`/sessions/${id}`),
  
  getQRCode: (id) => apiClient.get(`/sessions/${id}/qr`),
  
  reconnectSession: (id) => apiClient.post(`/sessions/${id}/reconnect`),

  // Messages
  sendMessage: (sessionId, to, text) =>
    apiClient.post(`/sessions/${sessionId}/messages`, { to, text }),
  
  sendMediaMessage: (sessionId, to, media, text) =>
    apiClient.post(`/sessions/${sessionId}/messages`, { to, text, media }),
  
  getMessages: (sessionId, params = {}) =>
    apiClient.get(`/sessions/${sessionId}/messages`, { params }),
  
  getMessage: (sessionId, messageId) =>
    apiClient.get(`/sessions/${sessionId}/messages/${messageId}`),
  
  getMessageStats: (sessionId) =>
    apiClient.get(`/sessions/${sessionId}/messages-stats`),

  // Groups
  getGroups: (sessionId) =>
    apiClient.get(`/sessions/${sessionId}/groups`),
  
  getGroup: (sessionId, groupId) =>
    apiClient.get(`/sessions/${sessionId}/groups/${groupId}`),

  // Health - utilise l'URL du backend configurée
  getHealth: () => {
    const baseUrl = API_BASE_URL.replace('/api/v1', '');
    return axios.get(`${baseUrl}/health`);
  },
  
  getReady: () => {
    const baseUrl = API_BASE_URL.replace('/api/v1', '');
    return axios.get(`${baseUrl}/ready`);
  },
};

export default api;
export { API_KEY, API_BASE_URL };
