import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { showLoader, hideLoader } from '../utils/loaderState';

const navItems = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Manage Products', to: '/admin/manage' },
  { label: 'Add Product', to: '/admin/add-product' },
];

const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    showLoader();
    setTimeout(() => {
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
      hideLoader();
      navigate('/login');
    }, 600);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#1b2128] font-sans text-gray-200 relative overflow-hidden">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0e1726] shadow-xl flex flex-col transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out border-r border-gray-800`}>
        <div className="p-6 border-b border-gray-800 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-black text-blue-500 tracking-wider">3MT</h2>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Machine Tools</span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-4">
          <div className="text-xs uppercase text-gray-500 font-bold tracking-widest pl-3 mb-2">Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg font-medium transition-colors border-l-4 ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-500 border-blue-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800 border-transparent hover:border-gray-500'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden h-full">
        <header className="h-16 bg-[#0e1726] border-b border-gray-800 flex items-center justify-between px-4 lg:px-10 z-10 shadow-sm shrink-0">
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-400 hover:text-white focus:outline-none mr-3"
              aria-label="Open admin menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-white text-xl font-black tracking-wider">3MT<span className="text-blue-500">TOOLS</span></div>
          </div>

          <div className="flex-1"></div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400 hidden sm:block mr-2 border-r border-gray-700 pr-4">Admin User</div>
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm font-bold tracking-wide transition-all shadow-sm"
            >
              LOGOUT
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#1b2128] p-6 lg:p-10 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
