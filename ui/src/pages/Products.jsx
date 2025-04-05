/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getProducts } from '../api/api';
import { containerStyles } from './style';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(err.message || 'خطا در بارگذاری محصولات'));
  }, []);

  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;
  if (!products.length) return <div className="text-center mt-20">در حال بارگذاری...</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">محصولات</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <img
                src={product.image || 'https://via.placeholder.com/150'}
                alt={product.name}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h2 className="text-xl font-semibold text-gray-800">{product.name}</h2>
              {product.discount?.percent ? (
                <p className="text-green-600 mb-2">
                  تخفیف: {product.discount.percent}% ({(product.price * (product.discount.percent / 100)).toLocaleString()} تومان)
                </p>
              ) : null}
              <p className="text-indigo-600 font-bold mt-2">{product.price} تومان</p>
            </Link>
          ))}
        </div>
        {/* Temporary content for scrolling */}
        {Array(20).fill().map((_, index) => (
          <p key={index} className="text-gray-600 mt-4">
            این یک متن آزمایشی برای تست اسکرول است.
          </p>
        ))}
      </div>
    </div>
  );
};

export default Products;