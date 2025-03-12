/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { getCart } from '../api/api';
import { popupStyles, popupContentStyles } from './NavbarStyles';

const tableStyles = css`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  th,
  td {
    padding: 0.75rem;
    text-align: right;
    border-bottom: 1px solid #e5e7eb;
  }
  th {
    background-color: #f3f4f6;
    font-weight: 600;
  }
`;

const CartPopup = ({ onClose }) => {
  const [cart, setCart] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await getCart();
        console.log('Fetched cart data:', data); // Debug the API response
        setCart(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری سبد خرید');
        console.error('Cart fetch error:', err.response?.data);
      }
    };
    fetchCart();
  }, []);

  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div css={popupStyles} onClick={onClose}>
      <div css={popupContentStyles} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">سبد خرید</h2>
        {cart.length === 0 ? (
          <p className="text-gray-600">سبد خرید شما خالی است</p>
        ) : (
          <table css={tableStyles}>
            <thead>
              <tr>
                <th>محصول</th>
                <th>تعداد</th>
                <th>قیمت واحد</th>
                <th>قیمت کل</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td>{item.product?.name || 'محصول نامشخص'}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {item.product?.price
                      ? `${item.product.price.toLocaleString()} تومان`
                      : 'قیمت نامشخص'}
                  </td>
                  <td>
                    {(item.quantity * (item.product?.price || 0)).toLocaleString()} تومان
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition"
        >
          بستن
        </button>
      </div>
    </div>
  );
};

export default CartPopup;