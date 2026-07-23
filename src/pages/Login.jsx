import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { getDashboardHomePath } from '../utils/roles';
import axios from '../utils/axiosInstance';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [viewMode, setViewMode] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const getTitle = () => {
    if (viewMode === 'forgot') return 'Reset Password';
    if (viewMode === 'resetOtp') return 'Verify Reset OTP';
    if (viewMode === 'resetPassword') return 'Set New Password';
    return 'Secure Login';
  };

  const getSubtitle = () => {
    if (viewMode === 'forgot') return 'Enter your registered staff email';
    if (viewMode === 'resetOtp') return 'Enter the OTP sent to your email';
    if (viewMode === 'resetPassword') return 'Create a new account password';
    return 'Machine Tools Administration';
  };

  const clearMessages = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();
    try {
      const role = await login(email, password);
      toast.success('Login successful!');
      navigate(getDashboardHomePath(role));
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed! Please check credentials.';
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();

    try {
      const response = await axios.post('/api/auth/forgot-password', { email: resetEmail });
      setSuccessMsg(
        response.data?.devOtp
          ? `Development OTP: ${response.data.devOtp}`
          : response.data?.message || 'If this email is registered, password reset instructions have been sent.'
      );
      setViewMode('resetOtp');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to request password reset.';
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearMessages();

    try {
      const response = await axios.post('/api/auth/verify-reset-otp', {
        email: resetEmail,
        otp: resetOtp,
      });
      setResetToken(response.data.resetToken);
      setSuccessMsg(response.data?.message || 'OTP verified. Set your new password.');
      setViewMode('resetPassword');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to verify reset OTP.';
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('/api/auth/reset-password', {
        resetToken,
        password: newPassword,
      });
      setEmail(resetEmail);
      setPassword('');
      setResetOtp('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg(response.data?.message || 'Password reset successfully. Please log in.');
      setViewMode('login');
      toast.success('Password reset successfully');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to reset password.';
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const backToLogin = () => {
    clearMessages();
    setViewMode('login');
  };

  return (
    <div className="min-h-screen bg-[#0e1726] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-[#1b2128] rounded-2xl shadow-2xl overflow-hidden border border-gray-800">
        <div className="p-8 pb-10">
          <div className="text-center mb-10 mt-4">
            <h1 className="text-5xl font-black text-blue-500 tracking-wider mb-2">3MT</h1>
            <p className="text-gray-400 font-bold tracking-widest uppercase text-sm">{getSubtitle()}</p>
            <h2 className="mt-4 text-xl font-black text-white">{getTitle()}</h2>
          </div>
          
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-bold text-center shadow-inner">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-300 px-4 py-3 rounded-xl mb-6 text-sm font-bold text-center shadow-inner">
              {successMsg}
            </div>
          )}
          
          {viewMode === 'login' && (
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
            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                clearMessages();
                setViewMode('forgot');
              }}
              className="w-full text-sm font-bold text-blue-300 transition hover:text-blue-200"
            >
              Forgot password?
            </button>
          </form>
          )}

          {viewMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Registered Email</label>
                <input
                  type="email"
                  placeholder="employee@3mt.com"
                  className="w-full p-4 bg-[#0e1726] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 ${isLoading ? 'bg-blue-800 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'} text-white font-bold rounded-xl tracking-widest shadow-lg shadow-blue-900/20 transition-all transform`}
              >
                {isLoading ? 'SENDING...' : 'SEND RESET OTP'}
              </button>
              <button
                type="button"
                onClick={backToLogin}
                className="w-full text-sm font-bold text-gray-400 transition hover:text-white"
              >
                Back to login
              </button>
            </form>
          )}

          {viewMode === 'resetOtp' && (
            <form onSubmit={handleVerifyResetOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reset OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="6 digit OTP"
                  className="w-full p-4 bg-[#0e1726] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 ${isLoading ? 'bg-blue-800 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'} text-white font-bold rounded-xl tracking-widest shadow-lg shadow-blue-900/20 transition-all transform`}
              >
                {isLoading ? 'VERIFYING...' : 'VERIFY OTP'}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setViewMode('forgot');
                }}
                className="w-full text-sm font-bold text-gray-400 transition hover:text-white"
              >
                Change email
              </button>
            </form>
          )}

          {viewMode === 'resetPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  className="w-full p-4 bg-[#0e1726] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full p-4 bg-[#0e1726] border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 ${isLoading ? 'bg-blue-800 cursor-not-allowed opacity-75' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'} text-white font-bold rounded-xl tracking-widest shadow-lg shadow-blue-900/20 transition-all transform`}
              >
                {isLoading ? 'RESETTING...' : 'RESET PASSWORD'}
              </button>
            </form>
          )}
        </div>
        <div className="px-8 py-5 bg-[#0e1726] border-t border-gray-800 flex justify-center items-center">
          <p className="text-xs text-gray-500 font-medium">© {new Date().getFullYear()} 3MT Machine Tools. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
