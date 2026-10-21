import axios from 'axios';
import { showLoader, hideLoader } from './loaderState';

export const apiBaseURL = process.env.REACT_APP_API_BASE_URL?.trim().replace(/\/+$/, '');

if (!apiBaseURL) {
  throw new Error('REACT_APP_API_BASE_URL is not configured');
}

export const resolveApiAssetUrl = (path = '') => {
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  return `${apiBaseURL}/${String(path).replace(/^\/+/, '')}`;
};

const axiosInstance = axios.create({
  baseURL: apiBaseURL,
});

// Add Authorization header to each request if user is logged in
axiosInstance.interceptors.request.use(
  (config) => {
    showLoader();
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;
    const token = userInfo?.token || localStorage.getItem('token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    hideLoader();
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    hideLoader();
    return response;
  },
  (error) => {
    hideLoader();
    return Promise.reject(error);
  }
);

export default axiosInstance;
