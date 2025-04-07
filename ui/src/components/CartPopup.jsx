/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { getCart, updateCart, deleteFromCart, getDiscountByCode, getProductById } from '../api/api';
import { popupStyles, popupContentStyles } from './NavbarStyles';

const tableStyles = css`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  table-layout: fixed;

  th,
  td {
    padding: 0.75rem;
    text-align: right;
    border-bottom: 1px solid #e5e7eb;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  th {
    background-color: #f3f4f6;
    font-weight: 600;
    width: 25%;
  }

  td {
    width: 25%;
  }

  @media (max-width: 768px) {
    th,
    td {
      padding: 0.5rem;
    }
  }
`;

const popupSizing = css`
  ${popupContentStyles}
  max-width: 90vw;
  width: 800px;
  max-height: 80vh;
  overflow: auto;

  @media (max-width: 768px) {
    width: 95vw;
  }
`;

const quantityInputStyles = css`
  width: 60px;
  text-align: center;
  padding: 0.25rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
`;

const actionButtonStyles = css`
  padding: 0.25rem 0.5rem;
  margin: 0 0.25rem;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const CartPopup = ({ onClose }) => {
  const [cart, setCart] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState({});
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');

  useEffect(() => {
    const fetchCartData = async () => {
      try {
        const cartData = await getCart();
        setCart(cartData);

        // Fetch product details for all items in cart
        const productPromises = cartData.map((item) => getProductById(item.product_id));

        const productsData = await Promise.all(productPromises);
        const productsMap = productsData.reduce((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {});

        setProducts(productsMap);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری سبد خرید');
      } finally {
        setLoading(false);
      }
    };

    fetchCartData();
  }, []);

  const handleQuantityChange = async (cartId, newQuantity, product) => {
    if (newQuantity < (product?.minimum_order || 1) || (product?.rate && newQuantity % product.rate !== 0)) {
        return;
    }

    try {
      setLoading(true);
      await updateCart(cartId, newQuantity);
      setCart(
        cart.map((item) => (item.id === cartId ? { ...item, quantity: newQuantity } : item))
      );
    } catch (err) {
      setError(err.message || 'خطا در به‌روزرسانی تعداد');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrementQuantity = async (cartId, currentQuantity, product) => {
    const newQuantity = product?.rate ? currentQuantity + product.rate : currentQuantity + 1;
    await handleQuantityChange(cartId, newQuantity, product);
  };

  const handleDecrementQuantity = async (cartId, currentQuantity, product) => {
    const newQuantity = product?.rate ? currentQuantity - product.rate : currentQuantity - 1;
    await handleQuantityChange(cartId, newQuantity, product);
  };

  const handleDeleteItem = async (cartId) => {
    try {
      setLoading(true);
      await deleteFromCart(cartId);
      setCart(cart.filter((item) => item.id !== cartId));
    } catch (err) {
      setError(err.message || 'خطا در حذف از سبد خرید');
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

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError('');
  };

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

    cart.forEach((item) => {
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

  const { subtotal, total, discountAmount, totalItems } = calculateTotals();

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (loading) return <div className="text-center py-4">در حال بارگذاری...</div>;

  return (
    <div css={popupStyles} onClick={onClose}>
      <div css={popupSizing} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">سبد خرید</h2>

        {cart.length === 0 ? (
          <p className="text-gray-600">سبد خرید شما خالی است</p>
        ) : (
          <>
            <table css={tableStyles}>
              <thead>
                <tr>
                  <th>محصول</th>
                  <th>قیمت واحد</th>
                  <th>تعداد</th>
                  <th>جمع کل</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const product = products[item.product_id];
                  const price = calculatePrice(product);
                  const originalPrice = product?.price || 0;

                  return (
                    <tr key={item.id}>
                      <td>{product?.name || 'محصول نامشخص'}</td>
                      <td>
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
                      <td>
                        <div className="flex items-center justify-center">
                          <button
                            css={actionButtonStyles}
                            onClick={() => handleDecrementQuantity(item.id, item.quantity, product)}
                            className="bg-gray-200"
                            disabled={item.quantity <= (product?.minimum_order || 1)}
                          >
                            -
                          </button>
                          <span css={quantityInputStyles}>{item.quantity}</span>
                          <button
                            css={actionButtonStyles}
                            onClick={() => handleIncrementQuantity(item.id, item.quantity, product)}
                            className="bg-gray-200"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{(price * item.quantity).toLocaleString()} تومان</td>
                      <td>
                        <button
                          css={actionButtonStyles}
                          onClick={() => handleDeleteItem(item.id)}
                          className="bg-red-500 text-white"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Discount Section */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border rounded"
                  placeholder="کد تخفیف"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  disabled={!!appliedDiscount}
                />
                {appliedDiscount ? (
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded"
                    onClick={handleRemoveDiscount}
                  >
                    حذف تخفیف
                  </button>
                ) : (
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={handleApplyDiscount}
                  >
                    اعمال تخفیف
                  </button>
                )}
              </div>
              {discountError && (
                <div className="text-red-500 text-sm mt-2">{discountError}</div>
              )}
              {appliedDiscount && (
                <div className="text-green-600 text-sm mt-2">
                  تخفیف {appliedDiscount.percent}% اعمال شد
                  {appliedDiscount.max_discount && (
                    <span> (حداکثر {appliedDiscount.max_discount.toLocaleString()} تومان)</span>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>تعداد کل اقلام:</span>
                <span>{totalItems.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>جمع کل سبد خرید:</span>
                <span>{subtotal.toLocaleString()} تومان</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>تخفیف:</span>
                  <span>-{discountAmount.toLocaleString()} تومان</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2">
                <span>مبلغ قابل پرداخت:</span>
                <span>{total.toLocaleString()} تومان</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-4 w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition"
            >
              بستن
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CartPopup;