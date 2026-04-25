import axios from 'axios';
import { showLoader, hideLoader } from './loaderState';

const axiosInstance = axios.create({
  //  baseURL: 'http://localhost:8080',  // Update with your backend URL
  baseURL:'https://threemt-server.onrender.com',
});

// Add Authorization header to each request if user is logged in
axiosInstance.interceptors.request.use(
  (config) => {
    showLoader();
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (userInfo && userInfo.token) {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
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
