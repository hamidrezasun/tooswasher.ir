/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCart, createOrder, getUserProfile, getProductById, deleteFromCart, getDiscountByCode } from '../api/api';
import { isAuthenticated } from '../api/auth';
import { containerStyles } from './style';

const orderSummaryStyles = css`
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
`;

const infoRowStyles = css`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
`;

const Order = () => {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState({});
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isAuthenticated()) {
          navigate('/login');
          return;
        }

        const [cartResponse, userResponse] = await Promise.all([
          getCart(),
          getUserProfile()
        ]);

        setCartItems(cartResponse || []);
        setUserInfo(userResponse);

        // Fetch product details for all items in cart
        const productPromises = cartResponse.map(item => getProductById(item.product_id));
        const productsData = await Promise.all(productPromises);
        const productsMap = productsData.reduce((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {});

        setProducts(productsMap);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری اطلاعات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const calculatePrice = (product) => {
    if (!product) return 0;
    const basePrice = product.price;
    const discount = product.discount;

    if (discount?.percent) {
      const discountedPrice = basePrice * (1 - discount.percent / 100);
      return discount.max_discount
        ? Math.max(discountedPrice, basePrice - discount.max_discount)
        : discountedPrice;
    }
    return basePrice;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalItems = 0;

    cartItems.forEach((item) => {
      const product = products[item.product_id];
      const price = calculatePrice(product);
      subtotal += price * item.quantity;
      totalItems += item.quantity;
    });

    let discountAmount = 0;
    if (appliedDiscount) {
      discountAmount = subtotal * (appliedDiscount.percent / 100);
      if (appliedDiscount.max_discount) {
        discountAmount = Math.min(discountAmount, appliedDiscount.max_discount);
      }
    }

    return {
      subtotal,
      total: subtotal - discountAmount,
      discountAmount,
      totalItems,
    };
  };

  const { subtotal, total, discountAmount } = calculateTotals();

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      const requiredFields = ['state', 'city', 'address', 'phone_number'];
      const missingFields = requiredFields.filter(field => !userInfo[field]);
      
      if (missingFields.length > 0) {
        setError(`لطفا این فیلدها را تکمیل کنید: ${missingFields.join(', ')}`);
        return;
      }

      if (cartItems.length === 0) {
        setError('سبد خرید شما خالی است');
        return;
      }

      // Prepare order items from cart
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
      }));

      // Prepare order payload with all required fields
      const orderPayload = {
        status: "Pending",
        state: userInfo.state,
        city: userInfo.city,
        address: userInfo.address,
        phone_number: userInfo.phone_number,
        user_id: userInfo.id, // Required field
        items: orderItems
      };

      // Create the order
      const order = await createOrder(orderPayload);

      // Clear the cart by deleting each item
      const deletePromises = cartItems.map(item => deleteFromCart(item.id));
      await Promise.all(deletePromises);

      // Update local state to reflect empty cart
      setCartItems([]);

      // Redirect to order confirmation page
      navigate(`/orders`);
    } catch (err) {
      console.error('Order creation error:', err.response?.data);
      const errorMessage = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.message || 
                         'خطا در ایجاد سفارش';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError('لطفا کد تخفیف را وارد کنید');
      return;
    }

    try {
      setLoading(true);
      const discount = await getDiscountByCode(discountCode);
      setAppliedDiscount(discount);
      setDiscountError('');
    } catch (err) {
      setDiscountError('کد تخفیف نامعتبر است یا منقضی شده');
      setAppliedDiscount(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-20">در حال بارگذاری...</div>;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">تکمیل سفارش</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">اطلاعات ارسال</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="font-medium">نام و نام خانوادگی:</p>
              <p>{userInfo?.name} {userInfo?.last_name}</p>
            </div>
            <div>
              <p className="font-medium">شماره تماس:</p>
              <p>{userInfo?.phone_number || 'ثبت نشده'}</p>
            </div>
            <div>
              <p className="font-medium">استان:</p>
              <p>{userInfo?.state || 'ثبت نشده'}</p>
            </div>
            <div>
              <p className="font-medium">شهر:</p>
              <p>{userInfo?.city || 'ثبت نشده'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="font-medium">آدرس کامل:</p>
              <p>{userInfo?.address || 'ثبت نشده'}</p>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="discount" className="block font-medium mb-2">کد تخفیف (اختیاری)</label>
            <div className="flex gap-2">
              <input
                type="text"
                id="discount"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder="کد تخفیف خود را وارد کنید"
                disabled={!!appliedDiscount}
              />
              {appliedDiscount ? (
                <button
                  onClick={() => {
                    setAppliedDiscount(null);
                    setDiscountCode('');
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  حذف تخفیف
                </button>
              ) : (
                <button
                  onClick={handleApplyDiscount}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  اعمال تخفیف
                </button>
              )}
            </div>
            {discountError && <p className="text-red-500 text-sm mt-1">{discountError}</p>}
            {appliedDiscount && (
              <p className="text-green-600 text-sm mt-1">
                تخفیف {appliedDiscount.percent}% اعمال شد
                {appliedDiscount.max_discount && (
                  <span> (حداکثر {appliedDiscount.max_discount.toLocaleString()} تومان)</span>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">محصولات سفارش</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 text-right">محصول</th>
                  <th className="p-3 text-right">تعداد</th>
                  <th className="p-3 text-right">قیمت واحد</th>
                  <th className="p-3 text-right">قیمت کل</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => {
                  const product = products[item.product_id];
                  const price = calculatePrice(product);
                  const originalPrice = product?.price || 0;

                  return (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">{product?.name || `محصول #${item.product_id}`}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">
                        {product?.discount ? (
                          <div className="flex flex-col">
                            <span className="line-through text-gray-500 text-xs">
                              {originalPrice.toLocaleString()} تومان
                            </span>
                            <span className="text-red-500">
                              {price.toLocaleString()} تومان
                            </span>
                          </div>
                        ) : (
                          <span>{price.toLocaleString()} تومان</span>
                        )}
                      </td>
                      <td className="p-3">{(price * item.quantity).toLocaleString()} تومان</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div css={orderSummaryStyles}>
            <div css={infoRowStyles}>
              <span>جمع کل سفارش:</span>
              <span>{subtotal.toLocaleString()} تومان</span>
            </div>
            {discountAmount > 0 && (
              <div css={infoRowStyles} className="text-green-600">
                <span>تخفیف:</span>
              <span>-{discountAmount.toLocaleString()} تومان</span>
              </div>
            )}
            <div css={infoRowStyles} className="font-bold border-t-2 border-gray-200 pt-2">
              <span>مبلغ قابل پرداخت:</span>
              <span>{total.toLocaleString()} تومان</span>
            </div>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading || cartItems.length === 0}
          css={css`
            width: 100%;
            background-color: ${loading ? '#9ca3af' : '#10b981'};
            color: white;
            padding: 0.75rem;
            border-radius: 0.375rem;
            font-weight: bold;
            transition: background-color 0.2s;
            &:hover {
              background-color: ${loading ? '#9ca3af' : '#059669'};
            }
            &:disabled {
              cursor: not-allowed;
              opacity: 0.7;
            }
          `}
        >
          {loading ? 'در حال پردازش...' : 'پرداخت و تکمیل سفارش'}
        </button>
      </div>
    </div>
  );
};

export default Order;