import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const role = await login(email, password);
      toast.success('Login successful!');
      if(role === "admin")
       navigate('/admin');
      else
       navigate('/home');
    } catch (error) {
      console.log(error);
      toast.error('Login failed! Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1726] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-[#1b2128] rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
        <div className="p-8 pb-10">
          <div className="text-center mb-10 mt-4">
            <h1 className="text-5xl font-black text-blue-500 tracking-wider mb-2">3MT</h1>
            <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">Machine Tools Administration</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
              <input
                type="email"
                placeholder="admin@3mt.com"
                className="w-full p-4 bg-[#0e1726] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full p-4 bg-[#0e1726] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl tracking-widest shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5 mt-4"
            >
              SECURE LOGIN
            </button>
          </form>
        </div>
        <div className="px-8 py-5 bg-[#0e1726] border-t border-gray-800 flex justify-center items-center">
          <p className="text-xs text-gray-500 font-medium">© {new Date().getFullYear()} 3MT Machine Tools. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;