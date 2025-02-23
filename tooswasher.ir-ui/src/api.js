import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getPages = (skip = 0, limit = 100) =>
  api.get('/pages/', { params: { skip, limit } }).then((res) => res.data);

export const getPage = (pageId) =>
  api.get(`/pages/${pageId}`).then((res) => res.data);

export const createPage = (pageData) =>
  api.post('/pages/', pageData).then((res) => res.data);

export const updatePage = (pageId, pageData) =>
  api.put(`/pages/${pageId}`, pageData).then((res) => res.data);

export const deletePage = (pageId) =>
  api.delete(`/pages/${pageId}`);