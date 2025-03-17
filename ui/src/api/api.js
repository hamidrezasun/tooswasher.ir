import axios from 'axios';
import { getToken } from './auth';

const API_URL = '/api'; // Adjust if needed

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json','accept': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};

const token = getToken();
if (token) setAuthToken(token);

// --- User Endpoints ---
export const loginForAccessToken = async (formData) => {
  // POST /users/token - Login for access token
  try {
    const response = await api.post('/users/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const token = response.data.access_token;
    localStorage.setItem('access_token', token);
    setAuthToken(token);
    return response.data;
  } catch (err) {
    console.error('Login error:', err.response?.data || err.message);
    throw err;
  }
};

export const registerUser = async (userData) => (await api.post('/users/register', userData)).data; // POST /users/register - Register a new user
export const getUserProfile = async () => (await api.get('/users/me')).data; // GET /users/me - Get current user's profile
export const getAllUsers = async () => (await api.get('/users/all')).data; // GET /users/all - Get all users (admin only)
export const updateUserRole = async (userId, role) => (await api.put(`/users/${userId}/role`, { role })).data; // PUT /users/{user_id}/role - Update user role (admin only)
export const requestPasswordReset = async (email) => (await api.post('/users/request-password-reset', null, { params: { email } })).data; // POST /users/request-password-reset - Request password reset
export const resetPassword = async (resetData) => (await api.post('/users/reset-password', resetData)).data; // POST /users/reset-password - Reset password with token
export const changePassword = async (passwordData) => (await api.put('/users/change-password', passwordData)).data; // PUT /users/change-password - Change current user's password
export const updateUser = async (data) => (await api.put('/users/edit', data)).data; // PUT /users/edit - Update current user's details
export const searchUsersByRole = async (role, skip = 0, limit = 100) => 
  (await api.get('/users/search-by-role/', { params: { role, skip, limit } })).data; // GET /users/search-by-role/ - Search users by role (admin only)
export const searchUsersByUsername = async (username, skip = 0, limit = 100) => 
  (await api.get('/users/search-by-username/', { params: { username, skip, limit } })).data; // GET /users/search-by-username/ - Search users by username (admin only)
export const searchUsersByEmail = async (email, skip = 0, limit = 100) => 
  (await api.get('/users/search-by-email/', { params: { email, skip, limit } })).data; // GET /users/search-by-email/ - Search users by email (admin only)
export const searchUsersByNationalId = async (national_id, skip = 0, limit = 100) => 
  (await api.get('/users/search-by-national-id/', { params: { national_id, skip, limit } })).data; // GET /users/search-by-national-id/ - Search users by national ID (admin only)
export const searchUsersByName = async (name, skip = 0, limit = 100) => 
  (await api.get('/users/search-by-name/', { params: { name, skip, limit } })).data; // GET /users/search-by-name/ - Search users by name or last name (admin only)
export const searchUsersByPhoneNumber = async (phone_number, skip = 0, limit = 100) => 
  (await api.get('/users/search-by-phone-number/', { params: { phone_number, skip, limit } })).data; // GET /users/search-by-phone-number/ - Search users by phone number (admin only)
export const adminUpdateUser = async (userId, userData) => {
  return (await api.put(`/users/${userId}/admin-update`, userData)).data;
};
// --- Product Endpoints ---
export const getProducts = async () => (await api.get('/products/')).data; // GET /products/ - Get all products
export const searchProducts = async (query, skip = 0, limit = 100) => 
  (await api.get('/products/search/', { params: { query, skip, limit } })).data; // GET /products/search/ - Search products by name
export const getProductById = async (id) => (await api.get(`/products/${id}`)).data; // GET /products/{product_id} - Get product by ID
export const createProduct = async (data) => (await api.post('/products/', data)).data; // POST /products/ - Create a product (admin only)
export const updateProduct = async (id, data) => (await api.put(`/products/${id}`, data)).data; // PUT /products/{product_id} - Update a product (admin only)
export const deleteProduct = async (id) => await api.delete(`/products/${id}`); // DELETE /products/{product_id} - Delete a product (admin only)

// --- Cart Endpoints ---
export const addToCart = async (productId, quantity) => (await api.post('/cart/', { product_id: productId, quantity })).data; // POST /cart/ - Add item to cart
export const getCart = async () => (await api.get('/cart/')).data; // GET /cart/ - Get current user's cart
export const updateCart = async (cartId, quantity) => (await api.put(`/cart/${cartId}`, null, { params: { quantity } })).data; // PUT /cart/{cart_id} - Update cart item quantity
export const deleteFromCart = async (cartId) => (await api.delete(`/cart/${cartId}`)).data; // DELETE /cart/{cart_id} - Remove item from cart

// --- Category Endpoints ---
export const getCategoryById = async (id) => (await api.get(`/categories/${id}`)).data; // GET /categories/{category_id} - Get category by ID
export const getCategories = async () => (await api.get('/categories/')).data; // GET /categories/ - Get all categories
export const createCategory = async (data) => (await api.post('/categories/', data)).data; // POST /categories/ - Create a category (admin only)
export const updateCategory = async (id, data) => (await api.put(`/categories/${id}`, data)).data; // PUT /categories/{category_id} - Update a category (admin only)
export const deleteCategory = async (id) => await api.delete(`/categories/${id}`); // DELETE /categories/{category_id} - Delete a category (admin only)

// --- Page Endpoints ---
export const getPages = async () => (await api.get('/pages/')).data; // GET /pages/ - Get all pages
export const getPageById = async (id) => (await api.get(`/pages/${id}`)).data; // GET /pages/{page_id} - Get page by ID
export const createPage = async (data) => (await api.post('/pages/', data)).data; // POST /pages/ - Create a page (admin only)
export const updatePage = async (id, data) => (await api.put(`/pages/${id}`, data)).data; // PUT /pages/{page_id} - Update a page (admin only)
export const deletePage = async (id) => await api.delete(`/pages/${id}`); // DELETE /pages/{page_id} - Delete a page (admin only)
export const searchPages = async (query, skip = 0, limit = 100) => 
  (await api.get('/pages/search/', { params: { query, skip, limit } })).data; // GET /pages/search/ - Search pages by name

// --- Order Endpoints ---
export const createOrder = async (data) => (await api.post('/orders/', data)).data; // POST /orders/ - Create an order
export const getOrders = async (skip = 0, limit = 100) => (await api.get('/orders/', { params: { skip, limit } })).data; // GET /orders/ - Get all orders
export const getOrder = async (id) => (await api.get(`/orders/${id}`)).data; // GET /orders/{order_id} - Get order by ID
export const updateOrder = async (id, data) => (await api.put(`/orders/${id}`, data)).data; // PUT /orders/{order_id} - Update an order
export const deleteOrder = async (id) => await api.delete(`/orders/${id}`); // DELETE /orders/{order_id} - Delete an order

// --- Discount Endpoints ---
export const getDiscounts = async () => (await api.get('/discounts/')).data; // GET /discounts/ - Get all discounts
export const createDiscount = async (data) => (await api.post('/discounts/', data)).data; // POST /discounts/ - Create a discount (admin only)
export const updateDiscount = async (id, data) => (await api.put(`/discounts/${id}`, data)).data; // PUT /discounts/{discount_id} - Update a discount (admin only)
export const deleteDiscount = async (id) => await api.delete(`/discounts/${id}`); // DELETE /discounts/{discount_id} - Delete a discount (admin only)
export const getDiscountByCode = async (code) => (await api.get(`/discounts/code/${code}`)).data; // GET /discounts/code/{code} - Get discount by code

// --- Payment Endpoints ---
export const createPayment = async (data) => (await api.post('/payments/payments/', data)).data; // POST /payments/payments/ - Create a payment
export const getPayments = async (skip = 0, limit = 10) => (await api.get('/payments/payments/', { params: { skip, limit } })).data; // GET /payments/payments/ - Get all payments
export const getPayment = async (id) => (await api.get(`/payments/payments/${id}`)).data; // GET /payments/payments/{payment_id} - Get payment by ID
export const updatePayment = async (id, data) => (await api.put(`/payments/payments/${id}`, data)).data; // PUT /payments/payments/{payment_id} - Update a payment
export const deletePayment = async (id) => await api.delete(`/payments/payments/${id}`); // DELETE /payments/payments/{payment_id} - Delete a payment

// --- Event Endpoints ---
export const getEventById = async (id) => (await api.get(`/events/${id}`)).data; // GET /events/{event_id} - Get event by ID
export const getEvents = async () => (await api.get('/events/')).data; // GET /events/ - Get all events
export const createEvent = async (data) => (await api.post('/events/', data)).data; // POST /events/ - Create an event (admin only)
export const updateEvent = async (id, data) => (await api.put(`/events/${id}`, data)).data; // PUT /events/{event_id} - Update an event (admin only)
export const deleteEvent = async (id) => await api.delete(`/events/${id}`); // DELETE /events/{event_id} - Delete an event (admin only)
export const createEventActivity = async (eventId, data) => 
  (await api.post(`/events/${eventId}/activities/`, data)).data; // POST /events/{event_id}/activities/ - Create an event activity (admin only)
export const getEventActivities = async (eventId) => (await api.get(`/events/${eventId}/activities/`)).data; // GET /events/{event_id}/activities/ - Get activities for an event
export const getEventActivity = async (eventId, activityId) => 
  (await api.get(`/events/${eventId}/activities/${activityId}`)).data; // GET /events/{event_id}/activities/{activity_id} - Get specific event activity
export const updateEventActivity = async (eventId, activityId, data) => 
  (await api.put(`/events/${eventId}/activities/${activityId}`, data)).data; // PUT /events/{event_id}/activities/{activity_id} - Update an event activity (admin only)
export const deleteEventActivity = async (eventId, activityId) => 
  await api.delete(`/events/${eventId}/activities/${activityId}`); // DELETE /events/{event_id}/activities/{activity_id} - Delete an event activity (admin only)

// --- Deprecated or Mismatched Endpoint (to be removed or updated) ---
export const getUsersByRole = async (role) => 
  (await api.get('/users/', { params: { role } })).data; // GET /users/ - Deprecated; use searchUsersByRole instead
export const deleteUser = async (userId) => await api.delete(`/users/${userId}`); // DELETE /users/{user_id} - Delete a user (admin only)
export default { setAuthToken };