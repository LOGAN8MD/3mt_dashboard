import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../utils/axiosInstance';
import { useCart } from '../context/CartContext';
import { toast } from 'react-hot-toast';

const ProductDetail = () => {
  const [product, setProduct] = useState(null);
  const { id } = useParams();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`);
        console.log(response)
        setProduct(response.data);
      } catch (error) {
        toast.error('Failed to fetch product details');
      }
    };

    fetchProductDetail();
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product);
    toast.success('Product added to cart!');
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* <img src={`http://localhost:8080/${product.image}`} alt={product.name} className="w-full h-96 object-cover rounded-lg" /> */}
         <img src={`https://threemt-server.onrender.com/${product.image}`} alt={product.name} className="w-full h-96 object-cover rounded-lg" />
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-2">{product.description}</p>
          <p className="mt-4 text-xl font-semibold">${product.price}</p>
          <button
            onClick={handleAddToCart}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-md"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;