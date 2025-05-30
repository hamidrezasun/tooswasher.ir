// api.js
import axios from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, logoutUser } from './auth';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          logoutUser();
          return Promise.reject(error);
        }

        // Attempt to refresh tokens
        const response = await axios.post(`${API_URL}/users/refresh`, {
          refresh_token: refreshToken
        });
        
        const { access_token, refresh_token } = response.data;
        
        // Determine which storage to use based on where the original refresh token was
        const rememberMe = !!localStorage.getItem('refresh_token');
        saveTokens(access_token, refresh_token, rememberMe);
        
        // Update the Authorization header
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        logoutUser();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Initialize with existing token if available
const token = getAccessToken();
if (token) setAuthToken(token);


// --- User Endpoints ---
export const loginUser = async (username, password, rememberMe = false) => {
  try {
    const response = await api.post('/users/token', {
      username,
      password,
      remember_me: rememberMe
    });
    
    const { access_token, refresh_token } = response.data;
    saveTokens(access_token, refresh_token, rememberMe);
    setAuthToken(access_token);
    return response.data;
  } catch (err) {
    console.error('Login error:', err.response?.data || err.message);
    throw err;
  }
};
export const refreshTokens = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post('/users/refresh', {
      refresh_token: refreshToken
    });
    
    return response.data;
  } catch (err) {
    console.error('Token refresh error:', err.response?.data || err.message);
    throw err;
  }
};
export const registerUser = async (userData) => (await api.post('/users/register', userData)).data;
export const getUserProfile = async () => (await api.get('/users/me')).data;
export const getAllUsers = async () => (await api.get('/users/all')).data;
export const updateUserRole = async (userId, role) => (await api.put(`/users/${userId}/role`, { role })).data;
export const requestPasswordReset = async (email) => (await api.post('/users/request-password-reset', null, { params: { email } })).data;
export const resetPassword = async (resetData) => (await api.post('/users/reset-password', resetData)).data;
export const changePassword = async (passwordData) => (await api.put('/users/change-password', passwordData)).data;
export const updateUser = async (data) => (await api.put('/users/edit', data)).data;
export const getUserById = async (id) => (await api.get('/users/search-by-id/', { params: { id } })).data;
export const searchUsersByRole = async (role, skip = 0, limit = 100) =>
  (await api.get('/users/search-by-role/', { params: { role, skip, limit } })).data;
export const searchUsersByUsername = async (username, skip = 0, limit = 100) =>
  (await api.get('/users/search-by-username/', { params: { username, skip, limit } })).data;
export const searchUsersByEmail = async (email, skip = 0, limit = 100) =>
  (await api.get('/users/search-by-email/', { params: { email, skip, limit } })).data;
export const searchUsersByNationalId = async (national_id, skip = 0, limit = 100) =>
  (await api.get('/users/search-by-national-id/', { params: { national_id, skip, limit } })).data;
export const searchUsersByName = async (name, skip = 0, limit = 100) =>
  (await api.get('/users/search-by-name/', { params: { name, skip, limit } })).data;
export const searchUsersByPhoneNumber = async (phone_number, skip = 0, limit = 100) =>
  (await api.get('/users/search-by-phone-number/', { params: { phone_number, skip, limit } })).data;
export const deleteUser = async (userId) => await api.delete(`/users/${userId}`);
export const adminUpdateUser = async (userId, userData) => {
  return (await api.put(`/users/${userId}/admin-update`, userData)).data;
};

// --- Product Endpoints ---
export const getProducts = async (skip = 0, limit = 100) =>
  (await api.get('/products/', { params: { skip, limit } })).data;
export const searchProducts = async (query, skip = 0, limit = 100) =>
  (await api.get('/products/search/', { params: { query, skip, limit } })).data;
export const getProductById = async (id) => (await api.get(`/products/${id}`)).data;
export const createProduct = async (data) => (await api.post('/products/', data)).data;
export const updateProduct = async (id, data) => (await api.put(`/products/${id}`, data)).data;
export const deleteProduct = async (id) => await api.delete(`/products/${id}`);

// --- Cart Endpoints ---
export const addToCart = async (productId, quantity) => (await api.post('/cart/', { product_id: productId, quantity })).data;
export const getCart = async (skip = 0, limit = 100) =>
  (await api.get('/cart/', { params: { skip, limit } })).data;
export const updateCart = async (cartId, quantity) => (await api.put(`/cart/${cartId}`, null, { params: { quantity } })).data;
export const deleteFromCart = async (cartId) => (await api.delete(`/cart/${cartId}`)).data;

// --- Category Endpoints ---
export const getCategoryById = async (id) => (await api.get(`/categories/${id}`)).data;
export const getCategories = async (skip = 0, limit = 100) =>
  (await api.get('/categories/', { params: { skip, limit } })).data;
export const createCategory = async (data) => (await api.post('/categories/', data)).data;
export const updateCategory = async (id, data) => (await api.put(`/categories/${id}`, data)).data;
export const deleteCategory = async (id) => await api.delete(`/categories/${id}`);

// --- Page Endpoints ---
export const getPages = async (skip = 0, limit = 100) =>
  (await api.get('/pages/', { params: { skip, limit } })).data;
export const getPageById = async (id) => (await api.get(`/pages/${id}`)).data;
export const createPage = async (data) => (await api.post('/pages/', data)).data;
export const updatePage = async (id, data) => (await api.put(`/pages/${id}`, data)).data;
export const deletePage = async (id) => await api.delete(`/pages/${id}`);
export const searchPages = async (query, skip = 0, limit = 100) =>
  (await api.get('/pages/search/', { params: { query, skip, limit } })).data;

// --- Order Endpoints ---
export const createOrder = async (data) => (await api.post('/orders/', data)).data;
export const getOrders = async (skip = 0, limit = 100) => (await api.get('/orders/', { params: { skip, limit } })).data;
export const getOrdersAdmin = async (skip = 0, limit = 100) => (await api.get('/orders/all', { params: { skip, limit } })).data;
export const getOrder = async (id) => (await api.get(`/orders/${id}`)).data;
export const updateOrder = async (id, data) => (await api.put(`/orders/${id}`, data)).data;
export const deleteOrder = async (id) => await api.delete(`/orders/${id}`);

// --- Discount Endpoints ---
export const getDiscounts = async (skip = 0, limit = 100) =>
  (await api.get('/discounts/', { params: { skip, limit } })).data;
export const createDiscount = async (data) => (await api.post('/discounts/', data)).data;
export const getDiscount = async (id) => (await api.get(`/discounts/${id}`)).data;
export const updateDiscount = async (id, data) => (await api.put(`/discounts/${id}`, data)).data;
export const deleteDiscount = async (id) => await api.delete(`/discounts/${id}`);
export const getDiscountByCode = async (code) => (await api.get(`/discounts/code/${code}`)).data;

// --- Payment Endpoints ---
export const createPayment = async (data) => (await api.post('/payments/payments/', data)).data;
export const getPayments = async (skip = 0, limit = 10) => (await api.get('/payments/payments/', { params: { skip, limit } })).data;
export const getPayment = async (id) => (await api.get(`/payments/payments/${id}`)).data;
export const updatePayment = async (id, data) => (await api.put(`/payments/payments/${id}`, data)).data;
export const deletePayment = async (id) => await api.delete(`/payments/payments/${id}`);

// --- Event Endpoints ---
export const getEventById = async (id) => (await api.get(`/events/${id}`)).data;
export const getEvents = async (skip = 0, limit = 100) =>
  (await api.get('/events/', { params: { skip, limit } })).data;
export const createEvent = async (data) => (await api.post('/events/', data)).data;
export const updateEvent = async (id, data) => (await api.put(`/events/${id}`, data)).data;
export const deleteEvent = async (id) => await api.delete(`/events/${id}`);
export const createEventActivity = async (eventId, data) =>
  (await api.post(`/events/${eventId}/activities/`, data)).data;
export const getEventActivities = async (eventId, skip = 0, limit = 100) =>
  (await api.get(`/events/${eventId}/activities/`, { params: { skip, limit } })).data;
export const getEventActivity = async (eventId, activityId) =>
  (await api.get(`/events/${eventId}/activities/${activityId}`)).data;
export const updateEventActivity = async (eventId, activityId, data) =>
  (await api.put(`/events/${eventId}/activities/${activityId}`, data)).data;
export const deleteEventActivity = async (eventId, activityId) =>
  await api.delete(`/events/${eventId}/activities/${activityId}`);

// --- File Endpoints ---
export const uploadFile = async (file, isPublic = false) => {
  const formData = new FormData();
  formData.append('file', file);
  return (await api.post('/files/upload/', formData, {
    params: { public: isPublic },
    headers: { 'Content-Type': 'multipart/form-data' },
  })).data;
};

export const downloadFile = async (fileId) => {
  const response = await api.get(`/files/download/${fileId}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const listFiles = async (skip = 0, limit = 100) =>
  (await api.get('/files/', { params: { skip, limit } })).data.files;

export const deleteFile = async (fileId) => {
  try {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  } catch (err) {
    console.error('Delete file error:', err.response?.data || err.message);
    throw err;
  }
};

// --- Option Endpoints ---
export const getOptions = async (skip = 0, limit = 100) => (await api.get('/options/', { params: { skip, limit } })).data;
export const getOptionById = async (optionId) => (await api.get(`/options/${optionId}`)).data;
export const getOptionByName = async (optionName) => (await api.get(`/options/by-name/${optionName}`)).data;
export const createOption = async (optionData) => (await api.post('/options/', optionData)).data;
export const updateOption = async (optionId, optionData) => (await api.put(`/options/${optionId}`, optionData)).data;
export const deleteOption = async (optionId) => (await api.delete(`/options/${optionId}`)).data;

// --- Deprecated or Mismatched Endpoint ---
export const getUsersByRole = async (role) =>
  (await api.get('/users/', { params: { role } })).data;

// --- Workflow Endpoints ---
export const getWorkflows = async (skip = 0, limit = 100) =>
  (await api.get('/workflows/', { params: { skip, limit } })).data;
export const getWorkflow = async (workflowId) => 
  (await api.get(`/workflows/${workflowId}`)).data;
export const createWorkflow = async (data) => 
  (await api.post('/workflows/', data)).data;
export const createWorkflowFromTemplate = async (data) => 
  (await api.post('/workflows/from-template/', data)).data;
export const updateWorkflow = async (workflowId, data) => 
  (await api.put(`/workflows/${workflowId}`, data)).data;
export const deleteWorkflow = async (workflowId) => 
  await api.delete(`/workflows/${workflowId}`);
export const createWorkflowStep = async (workflowId, data) =>
  (await api.post(`/workflows/${workflowId}/steps/`, data)).data;
export const getWorkflowSteps = async (workflowId, skip = 0, limit = 100) =>
  (await api.get(`/workflows/${workflowId}/steps/`, { params: { skip, limit } })).data;
export const getWorkflowStep = async (workflowId, stepId) =>
  (await api.get(`/workflows/${workflowId}/steps/${stepId}`)).data;
export const updateWorkflowStep = async (workflowId, stepId, data) =>
  (await api.put(`/workflows/${workflowId}/steps/${stepId}`, data)).data;
export const deleteWorkflowStep = async (workflowId, stepId) =>
  await api.delete(`/workflows/${workflowId}/steps/${stepId}`);
export const getTemplateSteps = async (workflowId, skip = 0, limit = 100) =>
  (await api.get(`/workflows/${workflowId}/template-steps/`, { params: { skip, limit } })).data;
export const getTemplateStep = async (workflowId, stepTemplateId) =>
  (await api.get(`/workflows/${workflowId}/template-steps/${stepTemplateId}`)).data;
export const createWorkflowStepTemplate = async (workflowId, data) =>
  (await api.post(`/workflows/${workflowId}/template-steps/`, data)).data;
export const updateWorkflowStepTemplate = async (workflowId, stepTemplateId, data) =>
  (await api.put(`/workflows/${workflowId}/template-steps/${stepTemplateId}`, data)).data;
export const deleteWorkflowStepTemplate = async (workflowId, stepTemplateId) =>
  await api.delete(`/workflows/${workflowId}/template-steps/${stepTemplateId}`);

export default {
  setAuthToken,
  loginUser,
  registerUser,
  getUserProfile,
  getAllUsers,
  updateUserRole,
  requestPasswordReset,
  resetPassword,
  changePassword,
  updateUser,
  getUserById,
  searchUsersByRole,
  searchUsersByUsername,
  searchUsersByEmail,
  searchUsersByNationalId,
  searchUsersByName,
  searchUsersByPhoneNumber,
  deleteUser,
  adminUpdateUser,
  getProducts,
  searchProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addToCart,
  getCart,
  updateCart,
  deleteFromCart,
  getCategoryById,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  searchPages,
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
  getDiscounts,
  createDiscount,
  getDiscount,
  updateDiscount,
  deleteDiscount,
  getDiscountByCode,
  createPayment,
  getPayments,
  getPayment,
  updatePayment,
  deletePayment,
  getEventById,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  createEventActivity,
  getEventActivities,
  getEventActivity,
  updateEventActivity,
  deleteEventActivity,
  uploadFile,
  downloadFile,
  listFiles,
  deleteFile,
  getUsersByRole,
  getOptions,
  getOptionById,
  getOptionByName,
  createOption,
  updateOption,
  deleteOption,
  getWorkflows,
  getWorkflow,
  createWorkflow,
  createWorkflowFromTemplate,
  updateWorkflow,
  deleteWorkflow,
  createWorkflowStep,
  getWorkflowSteps,
  getWorkflowStep,
  updateWorkflowStep,
  deleteWorkflowStep,
  getTemplateSteps,
  getTemplateStep,
  createWorkflowStepTemplate,
  updateWorkflowStepTemplate,
  deleteWorkflowStepTemplate,
};