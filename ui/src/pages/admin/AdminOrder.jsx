/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getOrdersAdmin, updateOrder, deleteOrder, getUserProfile, searchUsersByName, searchProducts, getProductById, getUserById, getOrder } from '../../api/api';
import { isAuthenticated } from '../../api/auth';
import { containerStyles } from '../style';

const tableStyles = css`
  width: 100%;
  border-collapse: collapse;
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

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [newOrder, setNewOrder] = useState({
    user_id: null,
    user_name: '',
    status: 'Pending',
    state: '',
    city: '',
    address: '',
    phone_number: '',
    items: []
  });
  const [editingOrder, setEditingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [products, setProducts] = useState({});
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated()) {
          const user = await getUserProfile();
          setIsAdmin(user.role === 'admin');
          setCurrentUser(user);
        }
        const data = await getOrdersAdmin();
        setOrders(data || []);

        // Fetch product details for all items
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
      }
    };
    fetchData();
  }, []);

  const handleViewOrder = async (orderId) => {
    try {
      const order = await getOrder(orderId);
      setSelectedOrder(order);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'خطا در بارگذاری جزئیات سفارش');
    }
  };

  const closePopup = () => {
    setSelectedOrder(null);
  };

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setUserSearchResults([]);
      setShowUserSearch(false);
      return;
    }
    try {
      const results = await searchUsersByName(query);
      setUserSearchResults(results || []);
      setShowUserSearch(true);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'خطا در جستجوی کاربران');
    }
  };

  const handleSearchProducts = async (query) => {
    if (query.length < 2) {
      setProductSearchResults([]);
      setShowProductSearch(false);
      return;
    }
    try {
      const results = await searchProducts(query);
      setProductSearchResults(results || []);
      setShowProductSearch(true);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'خطا در جستجوی محصولات');
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder.status) {
      setError('وضعیت سفارش الزامی است');
      return;
    }
    try {
      const payload = {
        status: editingOrder.status,
        state: editingOrder.state || null,
        city: editingOrder.city || null,
        address: editingOrder.address || null,
        phone_number: editingOrder.phone_number || null
      };
      const updated = await updateOrder(editingOrder.id, payload);
      setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
      setEditingOrder(null);
      setSelectedOrder(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'خطا در ویرایش سفارش');
    }
  };

  const handleDeleteOrder = async (id) => {
    if (window.confirm('آیا مطمئن هستید؟')) {
      try {
        await deleteOrder(id);
        setOrders(orders.filter((o) => o.id !== id));
        if (selectedOrder?.id === id) {
          setSelectedOrder(null);
        }
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'خطا در حذف سفارش');
      }
    }
  };

  const selectUser = (user) => {
    const fullName = `${user.name || ''} ${user.last_name || ''}`.trim();
    if (editingOrder) {
      setEditingOrder({
        ...editingOrder,
        user_id: user.id,
        user_name: fullName
      });
    }
    setShowUserSearch(false);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const selectProduct = (product, index) => {
    if (editingOrder) {
      const updatedItems = [...editingOrder.items];
      updatedItems[index] = {
        ...updatedItems[index],
        product_id: product.id,
        product_name: product.name
      };
      setEditingOrder({
        ...editingOrder,
        items: updatedItems
      });
    }
    setShowProductSearch(false);
    setProductSearchQuery('');
    setProductSearchResults([]);
  };

  const removeUser = () => {
    if (editingOrder) {
      setEditingOrder({ ...editingOrder, user_id: null, user_name: '' });
    }
  };

  const removeProduct = (index) => {
    if (editingOrder) {
      const updatedItems = editingOrder.items.filter((_, i) => i !== index);
      setEditingOrder({ ...editingOrder, items: updatedItems });
    }
  };

  const addProductToOrder = () => {
    if (editingOrder) {
      setEditingOrder({
        ...editingOrder,
        items: [...editingOrder.items, { product_id: null, product_name: '', quantity: 1 }]
      });
    }
  };

  const handleEditClick = async (order) => {
    try {
      let userName = '';
      if (order.user_id) {
        userName = await fetchUserName(order.user_id);
      }
      const itemsWithNames = await Promise.all(
        order.items.map(async (item) => {
          let productName = '';
          if (item.product_id) {
            try {
              const product = await getProductById(item.product_id);
              productName = product.name || '';
            } catch {
              productName = `محصول #${item.product_id}`;
            }
          }
          return { ...item, product_name: productName };
        })
      );
      setEditingOrder({
        ...order,
        user_name: userName,
        items: itemsWithNames
      });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'خطا در بارگذاری اطلاعات سفارش');
    }
  };

  const fetchUserName = async (userId) => {
    try {
      const user = await getUserById(userId);
      return `${user?.name || ''} ${user?.last_name || ''}`.trim() || `کاربر #${userId}`;
    } catch {
      return `کاربر #${userId}`;
    }
  };

  const calculateItemPrice = (item) => {
    const product = products[item.product_id] || {};
    const basePrice = product.price || item.discounted_price || 0;
    if (item.discount_id && item.discounted_price) {
      return item.discounted_price / item.quantity;
    }
    return basePrice;
  };

  const calculateOrderTotals = (order) => {
    let subtotal = 0;
    order.items.forEach((item) => {
      const product = products[item.product_id] || {};
      const basePrice = product.price || item.discounted_price || 0;
      subtotal += basePrice * item.quantity;
    });
    const discountAmount = subtotal - order.total_amount;
    return { subtotal, total: order.total_amount, discountAmount };
  };

  const statusOptions = [
    { value: 'Pending', label: 'در انتظار' },
    { value: 'Processing', label: 'در حال پردازش' },
    { value: 'Shipped', label: 'ارسال شده' },
    { value: 'Delivered', label: 'تحویل داده شده' },
    { value: 'Cancelled', label: 'لغو شده' }
  ];

  const FetchName = ({ id, type }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchData = async () => {
        try {
          if (type === 'product') {
            const product = await getProductById(id);
            setName(product?.name || `محصول #${id}`);
          } else {
            const userName = await fetchUserName(id);
            setName(userName);
          }
        } catch {
          setName(type === 'product' ? `محصول #${id}` : `کاربر #${id}`);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [id, type]);

    if (loading) return 'در حال بارگذاری...';
    return name;
  };

  if (isAdmin === false) return <Navigate to="/products" />;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">مدیریت سفارش‌ها</h1>

        {editingOrder && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">ویرایش سفارش</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                {editingOrder.user_id ? (
                  <div className="p-2 border rounded bg-gray-50 flex justify-between items-center">
                    <span>{editingOrder.user_name}</span>
                    <button onClick={removeUser} className="text-red-500 hover:underline">
                      حذف
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="جستجوی مشتری"
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        handleSearchUsers(e.target.value);
                      }}
                      onFocus={() => setShowUserSearch(true)}
                      onBlur={() => setTimeout(() => setShowUserSearch(false), 200)}
                      className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                    />
                    {showUserSearch && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {userSearchResults.length > 0 ? (
                          userSearchResults.map((user) => (
                            <div
                              key={user.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                selectUser(user);
                              }}
                            >
                              {user.name} {user.last_name} ({user.email})
                            </div>
                          ))
                        ) : userSearchQuery ? (
                          <div className="p-2 text-gray-500">نتیجه‌ای یافت نشد</div>
                        ) : null}
                      </div>
                    )}
                  </>
                )}
              </div>
              <select
                value={editingOrder.status}
                onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="استان"
                value={editingOrder.state || ''}
                onChange={(e) => setEditingOrder({ ...editingOrder, state: e.target.value })}
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="شهر"
                value={editingOrder.city || ''}
                onChange={(e) => setEditingOrder({ ...editingOrder, city: e.target.value })}
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="شماره تماس"
                value={editingOrder.phone_number || ''}
                onChange={(e) => setEditingOrder({ ...editingOrder, phone_number: e.target.value })}
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="آدرس"
                value={editingOrder.address || ''}
                onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })}
                className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">اقلام سفارش</h3>
              {editingOrder.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                  <div className="relative">
                    {item.product_id ? (
                      <div className="p-2 border rounded bg-gray-50 flex justify-between items-center">
                        <span>{item.product_name}</span>
                        <button
                          onClick={() => removeProduct(index)}
                          className="text-red-500 hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="جستجوی محصول"
                          value={productSearchQuery}
                          onChange={(e) => {
                            setProductSearchQuery(e.target.value);
                            handleSearchProducts(e.target.value);
                          }}
                          onFocus={() => setShowProductSearch(true)}
                          onBlur={() => setTimeout(() => setShowProductSearch(false), 200)}
                          className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                        />
                        {showProductSearch && (
                          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {productSearchResults.length > 0 ? (
                              productSearchResults.map((product) => (
                                <div
                                  key={product.id}
                                  className="p-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    selectProduct(product, index);
                                  }}
                                >
                                  {product.name}
                                </div>
                              ))
                            ) : productSearchQuery ? (
                              <div className="p-2 text-gray-500">نتیجه‌ای یافت نشد</div>
                            ) : null}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder="تعداد"
                    value={item.quantity || 1}
                    min="1"
                    onChange={(e) => {
                      const updatedItems = [...editingOrder.items];
                      updatedItems[index] = { ...updatedItems[index], quantity: parseInt(e.target.value) || 1 };
                      setEditingOrder({ ...editingOrder, items: updatedItems });
                    }}
                    className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => removeProduct(index)}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    حذف آیتم
                  </button>
                </div>
              ))}
              <button
                onClick={addProductToOrder}
                className="mt-2 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                افزودن محصول
              </button>
            </div>
            <button
              onClick={handleUpdateOrder}
              className="mt-4 bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600 transition w-full"
            >
              ویرایش
            </button>
            <button
              onClick={() => setEditingOrder(null)}
              className="mt-2 bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition w-full"
            >
              لغو ویرایش
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-md" css={tableStyles}>
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-right">شناسه</th>
                <th className="p-3 text-right">مشتری</th>
                <th className="p-3 text-right">وضعیت</th>
                <th className="p-3 text-right">مبلغ کل</th>
                <th className="p-3 text-right">تاریخ ایجاد</th>
                <th className="p-3 text-right">آدرس</th>
                <th className="p-3 text-right">اقلام</th>
                <th className="p-3 text-right">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{order.id}</td>
                  <td className="p-3">
                    {order.user_id ? <FetchName id={order.user_id} type="user" /> : 'N/A'}
                  </td>
                  <td className="p-3">
                    {statusOptions.find(opt => opt.value === order.status)?.label || order.status}
                  </td>
                  <td className="p-3">{order.total_amount.toLocaleString()} تومان</td>
                  <td className="p-3">
                    {new Date(order.created_at).toLocaleDateString('fa-IR')}
                  </td>
                  <td className="p-3">{order.address || 'N/A'}</td>
                  <td className="p-3">
                    {order.items.map((item, index) => (
                      <div key={index}>
                        <FetchName id={item.product_id} type="product" /> - {item.quantity} عدد
                      </div>
                    ))}
                  </td>
                  <td className="p-3 flex space-x-2">
                    <button
                      onClick={() => handleViewOrder(order.id)}
                      className="text-blue-500 hover:underline"
                    >
                      مشاهده جزئیات
                    </button>
                    <button
                      onClick={() => handleEditClick(order)}
                      className="text-blue-500 hover:underline"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-red-500 hover:underline"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedOrder && (
          <div css={popupStyles} onClick={closePopup}>
            <div css={popupSizing} onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4 text-gray-800">جزئیات سفارش #{selectedOrder.id}</h2>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">اطلاعات سفارش</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="font-medium">مشتری:</p>
                    <p>{selectedOrder.user_id ? <FetchName id={selectedOrder.user_id} type="user" /> : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-medium">وضعیت:</p>
                    <p>{statusOptions.find(opt => opt.value === selectedOrder.status)?.label || selectedOrder.status}</p>
                  </div>
                  <div>
                    <p className="font-medium">تاریخ ایجاد:</p>
                    <p>{new Date(selectedOrder.created_at).toLocaleDateString('fa-IR')}</p>
                  </div>
                </div>

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
                        <th>تخفیف</th>
                        <th>جمع کل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => {
                        const product = products[item.product_id] || {};
                        const unitPrice = calculateItemPrice(item);
                        const originalPrice = product.price || unitPrice;
                        const itemDiscount = item.discount_id ? (originalPrice - unitPrice) * item.quantity : 0;

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
                                    {unitPrice.toLocaleString()} تومان
                                  </span>
                                </div>
                              ) : (
                                <span>{unitPrice.toLocaleString()} تومان</span>
                              )}
                            </td>
                            <td>{item.quantity}</td>
                            <td>{itemDiscount > 0 ? itemDiscount.toLocaleString() + ' تومان' : 'N/A'}</td>
                            <td>{(unitPrice * item.quantity).toLocaleString()} تومان</td>
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
                            <span>تخفیف کل:</span>
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
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleEditClick(selectedOrder)}
                  className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
                >
                  ویرایش
                </button>
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="flex-1 bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
                >
                  حذف
                </button>
                <button
                  onClick={closePopup}
                  className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;