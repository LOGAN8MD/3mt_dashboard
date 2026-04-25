import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">3mt Machine Tools</Link>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-4">
          <Link to="/cart" className="hover:text-blue-400 transition-colors">Cart</Link>
          <Link to="/login" className="hover:text-blue-400 transition-colors">Login</Link>
          <Link to="/register" className="hover:text-blue-400 transition-colors">Register</Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden mt-4 flex flex-col space-y-2 border-t border-gray-700 pt-4">
          <Link to="/cart" className="hover:text-blue-400 transition-colors py-2" onClick={() => setIsOpen(false)}>Cart</Link>
          <Link to="/login" className="hover:text-blue-400 transition-colors py-2" onClick={() => setIsOpen(false)}>Login</Link>
          <Link to="/register" className="hover:text-blue-400 transition-colors py-2" onClick={() => setIsOpen(false)}>Register</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;