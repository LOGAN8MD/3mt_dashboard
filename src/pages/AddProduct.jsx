// import React, { useState } from 'react';
// import axios from '../utils/axiosInstance';
// import { toast } from 'react-hot-toast';
// import { useNavigate } from 'react-router-dom';

// const AddProduct = () => {
//   const [name, setName] = useState('');
//   const [description, setDescription] = useState('');
//   const [price, setPrice] = useState('');
//   const [image, setImage] = useState(null);
//   const navigate = useNavigate();

//   const handleImageChange = (e) => {
//     setImage(e.target.files[0]);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append('name', name);
//     formData.append('description', description);
//     formData.append('price', price);
//     formData.append('image', image);

//     try {
//       await axios.post('/api/products', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       toast.success('Product added successfully!');
//       navigate('/admin');
//     } catch (error) {
//       toast.error('Failed to add product!');
//     }
//   };

//   return (
//     <div className="container mx-auto p-6 max-w-lg bg-white shadow-lg rounded-md">
//       <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
//       <form onSubmit={handleSubmit}>
//         <div className="mb-4">
//           <label htmlFor="name" className="block text-sm font-semibold">Product Name</label>
//           <input
//             type="text"
//             id="name"
//             className="w-full p-2 border border-gray-300 rounded-md"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label htmlFor="description" className="block text-sm font-semibold">Description</label>
//           <textarea
//             id="description"
//             className="w-full p-2 border border-gray-300 rounded-md"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             required
//           />
//         </div>

//         <div className="mb-4">
//           <label htmlFor="price" className="block text-sm font-semibold">Price</label>
//           <input
//             type="number"
//             id="price"
//             className="w-full p-2 border border-gray-300 rounded-md"
//             value={price}
//             onChange={(e) => setPrice(e.target.value)}
//             required
//           />
//         </div>

// {/*         <div className="mb-4">
//           <label htmlFor="image" className="block text-sm font-semibold">Product Image</label>
//           <input
//             type="file"
//             id="image"
//             className="w-full p-2 border border-gray-300 rounded-md"
//             accept="image/*"
//              capture="environment"
//             onChange={handleImageChange}
//             required
//           />
//         </div> */}


//         <div className="mb-4">
//   <label className="block text-sm font-semibold mb-1">Product Image</label>

//   {/* 📸 Camera Button */}
//   <input
//     type="file"
//     accept="image/*"
//     capture="environment"
//     onChange={handleImageChange}
//     id="cameraInput"
//     style={{ display: 'none' }}
//   />
//   <button
//     type="button"
//     onClick={() => document.getElementById('cameraInput').click()}
//     className="w-full p-2 mb-2 bg-green-500 text-white rounded-md"
//   >
//     📸 Take Photo
//   </button>

//   {/* 🖼 Gallery/File Button */}
//   <input
//     type="file"
//     accept="image/*"
//     onChange={handleImageChange}
//     id="fileInput"
//     style={{ display: 'none' }}
//   />
//   <button
//     type="button"
//     onClick={() => document.getElementById('fileInput').click()}
//     className="w-full p-2 bg-blue-500 text-white rounded-md"
//   >
//     🖼 Upload from Gallery
//   </button>
// </div>

        

//         {image && (
//           <div className="mb-4">
//             <p className="text-sm font-semibold">Preview:</p>
//             <img
//               src={URL.createObjectURL(image)}
//               alt="Preview"
//               className="mt-2 w-full h-48 object-cover border rounded"
//             />
//           </div>
//         )}

//         <button
//           type="submit"
//           className="w-full p-2 bg-blue-500 text-white rounded-md"
//         >
//           Add Product
//         </button>
//       </form>
//     </div>
//   );
// };

// export default AddProduct;


import React, { useState } from "react";
import axios from "../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AddProduct = () => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [size, setSize] = useState("");
  const [model, setModel] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  // 📸 Handle multiple image selection
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
  };

  // ❌ Remove one image
  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 🗑 Remove all images
  const handleClearImages = () => {
    setImages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("type", type);
    formData.append("category", category);
    formData.append("subCategory", subCategory);
    formData.append("brand", brand);
    formData.append("description", description);
    formData.append("size", size);
    formData.append("model", model);
    formData.append("price", price);
    formData.append("stock", stock);

    images.forEach((img) => {
      formData.append("images", img);
    });

    try {
      await axios.post("/api/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Product added successfully!");
      navigate("/admin");
    } catch (error) {
      toast.error("Failed to add product!");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-lg bg-white shadow-lg rounded-md">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit}>
        {/* Product Name */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Product Name</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Type */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Type</label>
          <input
            type="text"
            placeholder="machine | part | tool | accessory"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Category</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>

        {/* Sub Category */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Sub Category</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
          />
        </div>

        {/* Brand */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Brand</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Description</label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {/* Size */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Size</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </div>

        {/* Model */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Model</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>

        {/* Price */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Price</label>
          <input
            type="number"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        {/* Stock */}
        <div className="mb-4">
          <label className="block text-sm font-semibold">Stock</label>
          <input
            type="number"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>

        {/* Images */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">
            Product Images
          </label>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />

          {/* Preview */}
          {images.length > 0 && (
            <div className="mt-3 space-y-2">
              {images.map((img, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <img
                    src={URL.createObjectURL(img)}
                    alt="Preview"
                    className="w-20 h-20 object-cover border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    ✖ Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleClearImages}
                className="px-3 py-1 bg-gray-600 text-white rounded"
              >
                🗑 Remove All
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
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


