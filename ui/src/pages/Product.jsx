/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductPopup from '../components/ProductPopup';
import { getProductById, addToCart, updateProduct, deleteProduct, getUserProfile } from '../api/api';
import { isAuthenticated } from '../api/auth';
import { containerStyles } from './style';

const Product = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [quantityError, setQuantityError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProductById(productId);
        setProduct(data);
        // Set initial quantity to minimum order if it exists
        if (data.minimum_order) {
          setQuantity(data.minimum_order);
        }
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

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value) || 1;
    setQuantity(newQuantity);
    validateQuantity(newQuantity);
  };

  const validateQuantity = (qty) => {
    if (!product) return;
    
    let error = '';
    
    // Check minimum order
    if (product.minimum_order && qty < product.minimum_order) {
      error = `حداقل تعداد سفارش ${product.minimum_order} می‌باشد`;
    }
    
    // Check rate (if product has rate)
    if (product.rate && qty % product.rate !== 0) {
      error = `تعداد باید مضربی از ${product.rate} باشد`;
    }
    
    setQuantityError(error);
    return error === '';
  };

  const handleAddToCart = async () => {
    if (!product || !validateQuantity(quantity)) return;
    
    try {
      await addToCart(product.id, quantity);
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
      setShowEditPopup(false);
      // Reset quantity if minimum order changed
      if (data.minimum_order) {
        setQuantity(data.minimum_order);
      }
    } catch (err) {
      setError(err.message || 'خطا در به‌روزرسانی محصول');
    }
  };

  const calculateDiscountedPrice = (price, discount) => {
    if (!discount?.percent) return price;

    const discountAmount = price * (discount.percent / 100);
    // If max_discount exists and discount exceeds it, cap the discount
    if (discount.max_discount && discountAmount > discount.max_discount) {
      return Math.round(price - discount.max_discount);
    }
    // Otherwise, apply the percentage discount
    return Math.round(price * (1 - discount.percent / 100));
  };

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
                  {product.discount.max_discount && (
                    <span className="text-xs text-gray-500 ml-2">(حداکثر {product.discount.max_discount.toLocaleString()} تومان)</span>
                  )}
                </>
              ) : (
                <span className="text-gray-800 font-medium">{product.price.toLocaleString()} تومان</span>
              )}
            </div>
            <p className="mt-4 text-gray-600">{product.description || 'توضیحات در دسترس نیست'}</p>
            
            {/* Quantity selector */}
            <div className="mt-4">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                تعداد:
              </label>
              <input
                type="number"
                id="quantity"
                min={product.minimum_order || 1}
                step={product.rate || 1}
                value={quantity}
                onChange={handleQuantityChange}
                className="w-24 p-2 border border-gray-300 rounded"
              />
              {quantityError && (
                <p className="mt-1 text-sm text-red-500">{quantityError}</p>
              )}
              {product.minimum_order && (
                <p className="mt-1 text-xs text-gray-500">
                  حداقل سفارش: {product.minimum_order}
                </p>
              )}
              {product.rate && product.rate > 1 && (
                <p className="mt-1 text-xs text-gray-500">
                  مضربی از: {product.rate}
                </p>
              )}
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={!!quantityError}
              className={`mt-4 p-2 rounded transition w-full md:w-auto ${
                quantityError 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              افزودن به سبد خرید
            </button>
            
            {isAdmin && (
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setShowEditPopup(true)}
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