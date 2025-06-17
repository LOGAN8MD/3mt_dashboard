import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);  // to handle loading state

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Ideally, you should validate the token on the backend and get user data
      axios
        .get('/api/auth/user') // Update the route based on your API
        .then((response) => {
          setUser(response.data);  // Assuming response.data is user data
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
      console.log(response.data)
      let role=response.data.role
      const { token, user } = response.data;  // Assuming response contains token and user data
      localStorage.setItem('token', token); // Store token in localStorage
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log("@@@@@@@@@@@@@@@@@@@@@@@",role)
      setUser(user);
      return role;
    } catch (error) {
      console.log('%%%%%%%%%%%%%%%%%%@@@@@@@@@@@@@@@@@@%%%%%%%%%%%%%%%%%%%')
      console.error('Login failed', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log(`Data:`, { name, email, password });
      const response = await axios.post('/api/auth/register', { name, email, password });
      const { token, user } = response.data;  // Assuming response contains token and user data
      localStorage.setItem('token', token); // Store token in localStorage
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
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