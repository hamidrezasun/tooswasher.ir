export const saveToken = (token) => localStorage.setItem('access_token', token);
export const getToken = () => localStorage.getItem('access_token');
export const logoutUser = () => localStorage.removeItem('access_token');
export const isAuthenticated = () => !!getToken();