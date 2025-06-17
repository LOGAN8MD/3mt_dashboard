import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="space-y-4">
        <Link to="/admin/add-product" className="block bg-blue-500 text-white py-2 px-6 rounded-md">
          Add Product
        </Link>
        <Link to="/admin/orders" className="block bg-green-500 text-white py-2 px-6 rounded-md">
          View Orders
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;