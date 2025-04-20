// auth.js
export const saveTokens = (accessToken, refreshToken, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('access_token', accessToken);
    storage.setItem('refresh_token', refreshToken);
  };
  
  export const getAccessToken = () => {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  };
  
  export const getRefreshToken = () => {
    return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
  };
  
  export const logoutUser = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
  };
  
  export const isAuthenticated = () => !!getAccessToken();