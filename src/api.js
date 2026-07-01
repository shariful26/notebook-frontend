import axios from 'axios';

// Update base URL depending on environment if needed
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api'
  : 'https://notebook-server-git-main-sabbir0070s-projects.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
});

// Set token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
