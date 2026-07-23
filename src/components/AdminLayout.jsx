import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { showLoader, hideLoader } from '../utils/loaderState';
import { getDashboardHomePath, isAdminRole } from '../utils/roles';

const getStoredUser = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) return null;

  try {
    return JSON.parse(userInfo);
  } catch {
    localStorage.removeItem('userInfo');
    return null;
  }
};

const adminNavItems = [
  { label: 'Dashboard', to: '/admin' },
  { label: 'Manage Products', to: '/admin/manage' },
  { label: 'Add Product', to: '/admin/add-product' },
  { label: 'Employees', to: '/admin/employees' },
  { label: 'Customers', to: '/admin/customers' },
  { label: 'Enquiries', to: '/admin/enquiries' },
  { label: 'Demand Report', to: '/admin/demand-report' },
  { label: 'Pending Products', to: '/admin/pending-products' },
];

const userNavItems = [
  { label: 'Dashboard', to: '/user' },
  { label: 'Add Product Request', to: '/user/add-product' },
  { label: 'My Submissions', to: '/user/submissions' },
];

const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const isAdmin = isAdminRole(currentUser?.role);
  const navItems = isAdmin ? adminNavItems : userNavItems;
  const dashboardHome = getDashboardHomePath(currentUser?.role);
  const identityStyles = isAdmin
    ? {
        name: 'text-blue-300',
        role: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
      }
    : {
        name: 'text-green-300',
        role: 'border-green-500/30 bg-green-500/10 text-green-300',
      };

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
          <NavLink to={dashboardHome} onClick={closeMobileMenu} className="text-center">
            <h2 className="text-3xl font-black text-blue-500 tracking-wider">3MT</h2>
          </NavLink>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Machine Tools</span>
          <span className={`mt-4 max-w-full truncate text-sm font-black ${identityStyles.name}`}>
            {currentUser?.name || 'Dashboard User'}
          </span>
          <span className={`mt-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${identityStyles.role}`}>
            {isAdmin ? 'Admin Dashboard' : 'Employee Dashboard'}
          </span>
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
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button
              onClick={handleLogout}
              className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold tracking-wide text-red-400 shadow-sm transition-all hover:bg-red-500/20 sm:px-5 sm:text-sm"
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
