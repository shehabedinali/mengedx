import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3030', // Adjust this if your backend runs on a different port
});

export default api;
