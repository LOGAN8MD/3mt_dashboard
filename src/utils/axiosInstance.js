import axios from 'axios';

const axiosInstance = axios.create({
  // baseURL: 'http://localhost:8080',  // Update with your backend URL
  baseURL:'https://threemt-server.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization header to each request if user is logged in
axiosInstance.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (userInfo && userInfo.token) {
      config.headers['Authorization'] = `Bearer ${userInfo.token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;