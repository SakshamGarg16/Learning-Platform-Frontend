import axios from 'axios';

// Get base URL from env, default to local django server
// In Vite, env variables follow the VITE_ prefix convention
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// We can add auth interceptors here once Authentik is live
// api.interceptors.request.use(config => {
//   const token = localStorage.getItem('access_token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });
