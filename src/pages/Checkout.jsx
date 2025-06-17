import React from 'react';

const Checkout = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div>
        <form>
          <input
            type="text"
            placeholder="Name"
            className="w-full p-2 mb-4 border border-gray-300 rounded-md"
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 mb-4 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            placeholder="Shipping Address"
            className="w-full p-2 mb-4 border border-gray-300 rounded-md"
          />
          <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded-md">
            Complete Checkout
          </button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;