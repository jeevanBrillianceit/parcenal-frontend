import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL
});

axiosInstance.interceptors.request.use((config) => {
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const { token } = JSON.parse(userData);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // Optional: clear corrupt localStorage item
      localStorage.removeItem('user');
    }
  }
  return config;
}, (error) => Promise.reject(error));

export default axiosInstance;
