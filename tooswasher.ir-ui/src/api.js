import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://api.tooswasher.com',
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
