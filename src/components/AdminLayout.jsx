import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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

const adminNavGroups = [
  { label: 'Overview', items: [{ label: 'Dashboard', to: '/admin' }] },
  { label: 'Catalog', items: [
    { label: 'Manage Products', to: '/admin/manage' },
    { label: 'Add Product', to: '/admin/add-product' },
    { label: 'Pending Products', to: '/admin/pending-products' },
  ] },
  { label: 'People', items: [
    { label: 'Customers', to: '/admin/customers' },
    { label: 'Employees', to: '/admin/employees' },
  ] },
  { label: 'Business', items: [
    { label: 'Rentals', to: '/admin/rentals' },
    { label: 'Sales', to: '/admin/sales' },
    { label: 'Enquiries', to: '/admin/enquiries' },
  ] },
  { label: 'Communication', items: [
    { label: 'Create Reminder', to: '/admin/create-reminder' },
    { label: 'Reminders', to: '/admin/reminders' },
  ] },
  { label: 'Insights', items: [{ label: 'Demand Report', to: '/admin/demand-report' }] },
];

const userNavGroups = [
  { label: 'Overview', items: [{ label: 'Dashboard', to: '/user' }] },
  { label: 'Product Requests', items: [
    { label: 'Add Product Request', to: '/user/add-product' },
    { label: 'My Submissions', to: '/user/submissions' },
  ] },
];

const AdminLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const currentUser = getStoredUser();
  const isAdmin = isAdminRole(currentUser?.role);
  const navGroups = isAdmin ? adminNavGroups : userNavGroups;
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
        <button
          type="button"
          aria-label="Close dashboard menu"
          className="fixed inset-0 z-30 cursor-default bg-black/60 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-gray-800 bg-[#0e1726] shadow-xl transition duration-200 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="relative border-b border-gray-800 px-5 py-5">
          <button type="button" onClick={closeMobileMenu} aria-label="Close dashboard menu" className="absolute right-3 top-3 rounded p-2 text-xl leading-none text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden">&times;</button>
          <NavLink to={dashboardHome} onClick={closeMobileMenu} className="block text-center focus:outline-none focus:ring-2 focus:ring-blue-500">
            <h2 className="text-3xl font-black tracking-wider text-blue-500">3MT</h2>
          </NavLink>
          <p className="mt-1 text-center text-[11px] font-bold uppercase tracking-widest text-gray-500">Machine Tools</p>
          <div className="mt-4 border-t border-gray-800 pt-4 text-center">
            <p className={`break-words text-sm font-bold ${identityStyles.name}`}>
            {currentUser?.name || 'Dashboard User'}
            </p>
            <span className={`mt-2 inline-block rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${identityStyles.role}`}>
              {isAdmin ? 'Admin Workspace' : 'Employee Workspace'}
            </span>
          </div>
        </div>

        <nav aria-label="Dashboard navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {navGroups.map((group) => {
            const headingId = `nav-${group.label.toLowerCase().replaceAll(' ', '-')}`;
            return <section key={group.label} aria-labelledby={headingId}>
              <h2 id={headingId} className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500">{group.label}</h2>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin' || item.to === '/user'}
                    onClick={closeMobileMenu}
                    className={({ isActive }) =>
                      `block rounded border-l-2 px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
                        isActive
                          ? 'border-blue-400 bg-blue-500/15 text-white'
                          : 'border-transparent text-gray-400 hover:border-gray-600 hover:bg-gray-800/80 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </section>;
          })}
        </nav>

        <div className="border-t border-gray-800 px-5 py-3 text-center text-[10px] uppercase tracking-wider text-gray-600">3MT Administration</div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden h-full">
        <header className="h-16 bg-[#0e1726] border-b border-gray-800 flex items-center justify-between px-4 lg:px-10 z-10 shadow-sm shrink-0">
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mr-3 rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open admin menu"
              aria-expanded={isMobileMenuOpen}
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
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
