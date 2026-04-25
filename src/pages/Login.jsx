import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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
              disabled={isLoading}
              className={`w-full py-4 ${isLoading ? 'bg-blue-800 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'} text-white font-bold rounded-xl tracking-widest shadow-lg shadow-blue-900/20 transition-all transform mt-4`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  SECURING...
                </span>
              ) : (
                "SECURE LOGIN"
              )}
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