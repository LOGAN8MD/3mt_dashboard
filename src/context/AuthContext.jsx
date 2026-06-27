import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);  // to handle loading state

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (userInfo?.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${userInfo.token}`;
      setUser(userInfo);
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const userInfo = response.data;

      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      localStorage.setItem('token', userInfo.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userInfo.token}`;
      setUser(userInfo);

      return userInfo.role;
    } catch (error) {
      console.log('Login failed', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log(`Data:`, { name, email, password });
      const response = await axios.post('/api/auth/register', { name, email, password });
      const userInfo = response.data;

      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      localStorage.setItem('token', userInfo.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${userInfo.token}`;
      setUser(userInfo);
    } catch (error) {
      console.error('Registration failed', error);
    }
  };

  if (loading) return <div>Loading...</div>;  // Optional: show loading state while fetching user

  return (
    <AuthContext.Provider value={{ user, login, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);




// import React, { createContext, useState, useContext, useEffect } from 'react';
// import axios from 'axios';

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//       // Fetch user data or perform token validation here
//     }
//   }, []);

//   const login = async (email, password) => {
//     // Handle login logic
//   };

//   const register = async (name, email, password) => {
//     // Handle registration logic
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, register }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);
