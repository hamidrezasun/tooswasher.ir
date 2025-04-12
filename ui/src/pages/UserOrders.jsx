/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getOrders, getOrder, getProductById } from '../api/api';
import { isAuthenticated } from '../api/auth';
import { containerStyles } from './style';

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
  }

  @media (max-width: 768px) {
    th,
    td {
      padding: 0.5rem;
    }
  }
`;

const popupStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const popupSizing = css`
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 90vw;
  width: 800px;
  max-height: 80vh;
  overflow: auto;

  @media (max-width: 768px) {
    width: 95vw;
  }
`;

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!isAuthenticated()) {
          navigate('/login');
          return;
        }
        const data = await getOrders();
        setOrders(data || []);

        // Fetch product details for all items in all orders
        const productIds = new Set(data.flatMap(order => order.items.map(item => item.product_id)));
        const productPromises = Array.from(productIds).map(id => getProductById(id));
        const productsData = await Promise.all(productPromises);
        const productsMap = productsData.reduce((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {});
        setProducts(productsMap);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'خطا در بارگذاری سفارش‌ها');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [navigate]);

  const handleViewOrder = async (orderId) => {
    try {
      setLoading(true);
      const order = await getOrder(orderId);
      setSelectedOrder(order);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'خطا در بارگذاری جزئیات سفارش');
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    setSelectedOrder(null);
  };

  const calculateItemPrice = (item) => {
    const product = products[item.product_id];
    if (!product) return item.discounted_price || item.unit_price || 0;

    const basePrice = product.price;
    const discount = item.discount_id ? { percent: item.discount_percent, max_discount: item.max_discount } : null;

    if (discount?.percent) {
      const discountedPrice = basePrice * (1 - discount.percent / 100);
      return discount.max_discount
        ? Math.max(discountedPrice, basePrice - discount.max_discount)
        : discountedPrice;
    }
    return basePrice;
  };

  const calculateOrderTotals = (order) => {
    let subtotal = 0;
    order.items.forEach((item) => {
      const price = calculateItemPrice(item);
      subtotal += price * item.quantity;
    });
    const discountAmount = order.total_amount < subtotal ? subtotal - order.total_amount : 0;
    return { subtotal, total: order.total_amount, discountAmount };
  };

  if (loading) return <div className="text-center mt-20">در حال بارگذاری...</div>;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">سفارش‌های من</h1>

        {orders.length === 0 ? (
          <p className="text-center text-gray-600">هیچ سفارشی یافت نشد</p>
        ) : (
          <div className="overflow-x-auto">
            <table css={tableStyles}>
              <thead>
                <tr>
                  <th>شناسه سفارش</th>
                  <th>وضعیت</th>
                  <th>مبلغ کل</th>
                  <th>تاریخ</th>
                  <th>اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td>{order.id}</td>
                    <td>
                      {{
                        'Pending': 'در انتظار',
                        'Processing': 'در حال پردازش',
                        'Shipped': 'ارسال شده',
                        'Delivered': 'تحویل داده شده',
                        'Cancelled': 'لغو شده'
                      }[order.status] || order.status}
                    </td>
                    <td>{order.total_amount.toLocaleString()} تومان</td>
                    <td>{new Date(order.created_at).toLocaleDateString('fa-IR')}</td>
                    <td>
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="text-blue-500 hover:underline"
                      >
                        مشاهده جزئیات
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedOrder && (
          <div css={popupStyles} onClick={closePopup}>
            <div css={popupSizing} onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4 text-gray-800">جزئیات سفارش #{selectedOrder.id}</h2>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">اطلاعات ارسال</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-medium">استان:</p>
                    <p>{selectedOrder.state || 'ثبت نشده'}</p>
                  </div>
                  <div>
                    <p className="font-medium">شهر:</p>
                    <p>{selectedOrder.city || 'ثبت نشده'}</p>
                  </div>
                  <div>
                    <p className="font-medium">شماره تماس:</p>
                    <p>{selectedOrder.phone_number || 'ثبت نشده'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="font-medium">آدرس:</p>
                    <p>{selectedOrder.address || 'ثبت نشده'}</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2">اقلام سفارش</h3>
                <div className="overflow-x-auto">
                  <table css={tableStyles}>
                    <thead>
                      <tr>
                        <th>محصول</th>
                        <th>قیمت واحد</th>
                        <th>تعداد</th>
                        <th>جمع کل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => {
                        const product = products[item.product_id] || {};
                        const price = calculateItemPrice(item);
                        const originalPrice = product.price || price;

                        return (
                          <tr key={index}>
                            <td>{product.name || `محصول #${item.product_id}`}</td>
                            <td>
                              {item.discount_id ? (
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
                            <td>{item.quantity}</td>
                            <td>{(price * item.quantity).toLocaleString()} تومان</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  {(() => {
                    const { subtotal, total, discountAmount } = calculateOrderTotals(selectedOrder);
                    return (
                      <>
                        <div className="flex justify-between mb-2">
                          <span>جمع کل سفارش:</span>
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
                      </>
                    );
                  })()}
                </div>
              </div>
              <button
                onClick={closePopup}
                className="mt-4 w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition"
              >
                بستن
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrders;