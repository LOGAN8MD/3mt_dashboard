import React, { useState } from 'react';
import axios from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('image', image);

    try {
      await axios.post('/api/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Product added successfully!');
      navigate('/admin');
    } catch (error) {
      toast.error('Failed to add product!');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-lg bg-white shadow-lg rounded-md">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-semibold">Product Name</label>
          <input
            type="text"
            id="name"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-semibold">Description</label>
          <textarea
            id="description"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="price" className="block text-sm font-semibold">Price</label>
          <input
            type="number"
            id="price"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="image" className="block text-sm font-semibold">Product Image</label>
          <input
            type="file"
            id="image"
            className="w-full p-2 border border-gray-300 rounded-md"
            accept="image/*"
             capture="environment"
            onChange={handleImageChange}
            required
          />
        </div>

        {image && (
          <div className="mb-4">
            <p className="text-sm font-semibold">Preview:</p>
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className="mt-2 w-full h-48 object-cover border rounded"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded-md"
        >
          Add Product
        </button>
      </form>
    </div>
  );
};

export default AddProduct;