import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import ManageProducts from './pages/ManageProducts';
import ManageUsers from './pages/ManageUsers';
import ManageCustomers from './pages/ManageCustomers';
import ManageEnquiries from './pages/ManageEnquiries';
import ProductDemandReport from './pages/ProductDemandReport';
import PendingProducts from './pages/PendingProducts';
import UserDashboard from './pages/UserDashboard';
import UserAddProductRequest from './pages/UserAddProductRequest';
import UserSubmissions from './pages/UserSubmissions';
import AddProduct from './pages/AddProduct'; 
import GlobalSpinner from './components/GlobalSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import { ADMIN_ROLE, DASHBOARD_ROLES } from './utils/roles';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col relative">
        <GlobalSpinner />
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          
          {/* Admin Routes - standalone dashboard */}
          <Route element={<ProtectedRoute allowedRoles={[ADMIN_ROLE]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/manage" element={<ManageProducts />} />
            <Route path="/admin/add-product" element={<AddProduct />} />
            <Route path="/admin/employees" element={<ManageUsers />} />
            <Route path="/admin/customers" element={<ManageCustomers />} />
            <Route path="/admin/enquiries" element={<ManageEnquiries />} />
            <Route path="/admin/demand-report" element={<ProductDemandReport />} />
            <Route path="/admin/users" element={<Navigate to="/admin/employees" replace />} />
            <Route path="/admin/pending-products" element={<PendingProducts />} />
          </Route>

          {/* Employee Dashboard Routes - approved product visibility without admin controls */}
          <Route element={<ProtectedRoute allowedRoles={DASHBOARD_ROLES} />}>
            <Route path="/user" element={<UserDashboard />} />
            <Route path="/user/add-product" element={<UserAddProductRequest />} />
            <Route path="/user/submissions" element={<UserSubmissions />} />
          </Route>
          
          {/* Customer Storefront Routes - wrapped with Navbar and Footer */}
          <Route path="/*" element={
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/home" element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                </Routes>
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
