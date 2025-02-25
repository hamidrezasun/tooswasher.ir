import { api } from './api';
import qs from 'qs'; // You might need to install this package for encoding data

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const registerUser = (userData) =>
  api.post('/users/register', userData).then((res) => res.data);

export const loginUser = (credentials) => {
  const data = qs.stringify({
    username: credentials.username,
    password: credentials.password
  });

  return api.post('/users/token', data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then((res) => {
    if (res.data && res.data.access_token) {
      setToken(res.data.access_token); // Assuming the token is returned in `access_token`
    }
    return res.data;
  });
};

export const getUserProfile = () =>
  api.get('/users/me').then((res) => res.data);

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (error) {
    return null;
  }
};