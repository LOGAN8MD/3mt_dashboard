import React from 'react';
import { Link } from 'react-router-dom';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
      {/* <img src={`http://localhost:8080/${product.image}`} alt={product.name} className="w-full h-48 object-cover rounded-t-lg"/> */}
      <img src={`https://threemt-server.onrender.com/${product.image}`} alt={product.name} className="w-full h-48 object-cover rounded-t-lg"/>
      <h3 className="text-lg font-bold mt-2">{product.name}</h3>
      <p className="text-sm mt-1">{product.description}</p>
      <p className="font-bold mt-2">₹{product.price}</p>
      <Link to={`/product/${product._id}`} className="mt-4 inline-block text-blue-500">View Details</Link>
    </div>
  );
};

export default ProductCard;
