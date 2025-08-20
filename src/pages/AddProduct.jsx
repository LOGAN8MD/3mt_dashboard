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


import React, { useState } from 'react';
import axios from '../utils/axiosInstance';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: '',
    subCategory: '',
    brand: '',
    description: '',
    size: '',
    model: '',
    price: '',
    stock: '',
  });

  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    setImages([...images, ...Array.from(e.target.files)]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = new FormData();
    Object.keys(formData).forEach((key) => {
      productData.append(key, formData[key]);
    });

    images.forEach((img) => {
      productData.append('images', img);
    });

    try {
      await axios.post('/api/products', productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('✅ Product added successfully!');
      navigate('/admin');
    } catch (error) {
      toast.error('❌ Failed to add product!');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-lg bg-white shadow-lg rounded-md">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit}>

        {/* Product Name */}
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          required
        />

        {/* Type */}
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          required
        >
          <option value="">Select Type</option>
          <option value="machine">Machine</option>
          <option value="part">Part</option>
          <option value="tool">Tool</option>
          <option value="accessory">Accessory</option>
          <option value="spare">Spare</option>
        </select>

        {/* Category */}
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          required
        />

        {/* Sub Category */}
        <input
          type="text"
          name="subCategory"
          placeholder="Sub Category (optional)"
          value={formData.subCategory}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
        />

        {/* Brand */}
        <input
          type="text"
          name="brand"
          placeholder="Brand"
          value={formData.brand}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
        />

        {/* Description */}
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
        />

        {/* Size */}
        <input
          type="text"
          name="size"
          placeholder="Size (e.g. 7 inch)"
          value={formData.size}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
        />

        {/* Model */}
        <input
          type="text"
          name="model"
          placeholder="Model (e.g. AG-7)"
          value={formData.model}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
        />

        {/* Price */}
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          required
        />

        {/* Stock */}
        <input
          type="number"
          name="stock"
          placeholder="Stock"
          value={formData.stock}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
        />

        {/* Image Upload */}
<div className="mb-4">
  <label className="block text-sm font-semibold mb-1">Product Images</label>

  {/* 📸 Camera */}
  <input
    type="file"
    accept="image/*"
    capture="environment"
    multiple
    onChange={handleImageChange}
    id="cameraInput"
    style={{ display: 'none' }}
  />
  <button
    type="button"
    onClick={() => document.getElementById('cameraInput').click()}
    className="w-full p-2 mb-2 bg-green-500 text-white rounded-md"
  >
    📸 Take Photo
  </button>

  {/* 🖼 Gallery */}
  <input
    type="file"
    accept="image/*"
    multiple
    onChange={handleImageChange}
    id="fileInput"
    style={{ display: 'none' }}
  />
  <button
    type="button"
    onClick={() => document.getElementById('fileInput').click()}
    className="w-full p-2 bg-blue-500 text-white rounded-md"
  >
    🖼 Upload from Gallery
  </button>
</div>

{/* Preview with Remove */}
{images.length > 0 && (
  <div className="mb-4 grid grid-cols-2 gap-2">
    {images.map((img, index) => (
      <div key={index} className="relative">
        <img
          src={URL.createObjectURL(img)}
          alt={`Preview ${index + 1}`}
          className="w-full h-32 object-cover border rounded"
        />
        {/* ❌ Remove button */}
        <button
          type="button"
          onClick={() => setImages(images.filter((_, i) => i !== index))}
          className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded"
        >
          ✖
        </button>
      </div>
    ))}
  </div>
)}

          

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

