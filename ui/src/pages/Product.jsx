/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductPopup from '../components/ProductPopup'; // Import ProductPopup
import { getProductById, addToCart, updateProduct, deleteProduct, getUserProfile } from '../api/api';
import { isAuthenticated } from '../api/auth';
import { containerStyles } from './style';

const Product = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [showEditPopup, setShowEditPopup] = useState(false); // State for popup visibility

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProductById(productId);
        setProduct(data);
        if (isAuthenticated()) {
          const user = await getUserProfile();
          setIsAdmin(user.role === 'admin');
        }
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری محصول');
      }
    };
    fetchData();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product.id, product.minimum_order || 1);
      setError('محصول به سبد خرید اضافه شد!');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError(err.message || 'خطا در افزودن به سبد خرید');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('آیا مطمئن هستید؟')) {
      try {
        await deleteProduct(product.id);
        navigate('/products');
      } catch (err) {
        setError(err.message || 'خطا در حذف محصول');
      }
    }
  };

  const handleSaveProduct = async (data) => {
    try {
      const updated = await updateProduct(productId, data);
      setProduct(updated);
      setShowEditPopup(false); // Close popup after save
    } catch (err) {
      setError(err.message || 'خطا در به‌روزرسانی محصول');
    }
  };

  const calculateDiscountedPrice = (price, discount) =>
    discount?.percent ? Math.round(price * (1 - discount.percent / 100)) : price;

  if (error && !error.includes('اضافه شد')) return <div className="text-center text-red-500 mt-20">{error}</div>;
  if (!product) return <div className="text-center mt-20">در حال بارگذاری...</div>;

  const discountedPrice = calculateDiscountedPrice(product.price, product.discount);

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row">
          <img
            src={product.image || 'https://via.placeholder.com/400'}
            alt={product.name}
            className="w-full md:w-1/2 h-64 object-cover rounded"
          />
          <div className="md:ml-6 mt-4 md:mt-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
            <div className="mt-4 flex items-center">
              {product.discount?.percent ? (
                <>
                  <span className="line-through text-gray-500 text-sm">{product.price.toLocaleString()} تومان</span>
                  <span className="text-green-600 ml-2 font-medium">{discountedPrice.toLocaleString()} تومان</span>
                  <span className="text-xs text-red-500 ml-2">{product.discount.percent}% تخفیف</span>
                </>
              ) : (
                <span className="text-gray-800 font-medium">{product.price.toLocaleString()} تومان</span>
              )}
            </div>
            <p className="mt-4 text-gray-600">{product.description || 'توضیحات در دسترس نیست'}</p>
            <button
              onClick={handleAddToCart}
              className="mt-6 bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600 transition w-full md:w-auto"
            >
              افزودن به سبد خرید
            </button>
            {isAdmin && (
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setShowEditPopup(true)} // Open popup instead of navigating
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
                >
                  ویرایش
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
                >
                  حذف
                </button>
              </div>
            )}
            {error && error.includes('اضافه شد') && (
              <div className="mt-4 text-green-500">{error}</div>
            )}
          </div>
        </div>
        {showEditPopup && product && (
          <ProductPopup
            product={product}
            onSave={handleSaveProduct}
            onDelete={handleDelete}
            onClose={() => setShowEditPopup(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Product;