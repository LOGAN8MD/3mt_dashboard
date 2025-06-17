import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

const Cart = () => {
  const { cartItems, removeFromCart } = useCart();

  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => acc + item.price, 0);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty!</p>
      ) : (
        <div>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item._id} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p>${item.price}</p>
                </div>
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="bg-red-500 text-white py-1 px-4 rounded-md"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-bold">Total: ${calculateTotal()}</h2>
            <Link to="/checkout" className="mt-4 inline-block bg-blue-500 text-white py-2 px-6 rounded-md">
              Proceed to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
