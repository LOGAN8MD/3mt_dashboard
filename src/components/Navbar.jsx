import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="flex justify-between">
        <Link to="/" className="text-xl font-bold">3mt Machine Tools</Link>
        <div>
          <Link to="/cart" className="mr-4">Cart</Link>
          <Link to="/login" className="mr-4">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;