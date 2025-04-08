/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount, getUserProfile, searchUsersByName, searchProducts, getProductById, getUserById } from '../api/api';
import { isAuthenticated } from '../api/auth';
import { containerStyles } from './style';

const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    percent: '',
    max_discount: '',
    product_id: null,
    product_name: '',
    customer_id: null,
    customer_name: ''
  });
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [productSearchResults, setProductSearchResults] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated()) {
          const user = await getUserProfile();
          setIsAdmin(user.role === 'admin');
        }
        const data = await getDiscounts();
        setDiscounts(data || []);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری تخفیف‌ها');
      }
    };
    fetchData();
  }, []);

  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setUserSearchResults([]);
      setShowUserSearch(false);
      return;
    }
    try {
      const results = await searchUsersByName(query);
      console.log('User search results:', results);
      setUserSearchResults(results || []);
      setShowUserSearch(true);
    } catch (err) {
      setError(err.message || 'خطا در جستجوی کاربران');
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
      console.log('Product search results:', results);
      setProductSearchResults(results || []);
      setShowProductSearch(true);
    } catch (err) {
      setError(err.message || 'خطا در جستجوی محصولات');
    }
  };

  const handleAddDiscount = async () => {
    if (!newDiscount.percent) {
      setError('درصد تخفیف الزامی است');
      return;
    }
    try {
      const payload = {
        code: newDiscount.code || null, // Optional, send null if empty
        percent: parseFloat(newDiscount.percent),
        max_discount: parseFloat(newDiscount.max_discount) || 0,
        product_id: newDiscount.product_id || null,
        customer_id: newDiscount.customer_id || null
      };
      console.log('Sending payload to createDiscount:', payload);
      const discount = await createDiscount(payload);
      setDiscounts([...discounts, discount]);
      setNewDiscount({
        code: '',
        percent: '',
        max_discount: '',
        product_id: null,
        product_name: '',
        customer_id: null,
        customer_name: ''
      });
      setError(null);
    } catch (err) {
      console.error('Error response from createDiscount:', err.response || err);
      setError(err.response?.data?.detail || err.message || 'خطا در افزودن تخفیف');
    }
  };

  const handleEditDiscount = async () => {
    if (!editingDiscount.percent) {
      setError('درصد تخفیف الزامی است');
      return;
    }
    try {
      const payload = {
        code: editingDiscount.code || null, // Optional, send null if empty
        percent: parseFloat(editingDiscount.percent),
        max_discount: parseFloat(editingDiscount.max_discount) || 0,
        product_id: editingDiscount.product_id || null,
        customer_id: editingDiscount.customer_id || null
      };
      console.log('Sending payload to updateDiscount:', payload);
      const updated = await updateDiscount(editingDiscount.id, payload);
      setDiscounts(discounts.map((d) => (d.id === updated.id ? updated : d)));
      setEditingDiscount(null);
      setError(null);
    } catch (err) {
      console.error('Error response from updateDiscount:', err.response || err);
      setError(err.response?.data?.detail || err.message || 'خطا در ویرایش تخفیف');
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (window.confirm('آیا مطمئن هستید؟')) {
      try {
        await deleteDiscount(id);
        setDiscounts(discounts.filter((d) => d.id !== id));
      } catch (err) {
        setError(err.message || 'خطا در حذف تخفیف');
      }
    }
  };

  const selectUser = (user) => {
    const fullName = `${user.name || ''} ${user.last_name || ''}`.trim();
    console.log('Selected user:', user);
    if (editingDiscount) {
      setEditingDiscount({
        ...editingDiscount,
        customer_id: user.id,
        customer_name: fullName
      });
    } else {
      setNewDiscount({
        ...newDiscount,
        customer_id: user.id,
        customer_name: fullName
      });
    }
    setShowUserSearch(false);
    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const selectProduct = (product) => {
    console.log('Selected product:', product);
    const productId = product.id;
    const productName = product.name;
    if (editingDiscount) {
      setEditingDiscount(prev => {
        const updated = {
          ...prev,
          product_id: productId,
          product_name: productName
        };
        console.log('Updated editingDiscount:', updated);
        return updated;
      });
    } else {
      setNewDiscount(prev => {
        const updated = {
          ...prev,
          product_id: productId,
          product_name: productName
        };
        console.log('Updated newDiscount:', updated);
        return updated;
      });
    }
    setShowProductSearch(false);
    setProductSearchQuery('');
    setProductSearchResults([]);
  };

  const removeCustomer = () => {
    if (editingDiscount) {
      setEditingDiscount({ ...editingDiscount, customer_id: null, customer_name: '' });
    } else {
      setNewDiscount({ ...newDiscount, customer_id: null, customer_name: '' });
    }
  };

  const removeProduct = () => {
    if (editingDiscount) {
      setEditingDiscount({ ...editingDiscount, product_id: null, product_name: '' });
    } else {
      setNewDiscount({ ...newDiscount, product_id: null, product_name: '' });
    }
  };

  const handleEditClick = async (discount) => {
    try {
      let customerName = '';
      let productName = '';
      if (discount.customer_id) {
        const user = await getUserById(discount.customer_id);
        customerName = `${user.name || ''} ${user.last_name || ''}`.trim();
      }
      if (discount.product_id) {
        const product = await getProductById(discount.product_id);
        console.log('Fetched product for edit:', product);
        productName = product.name || '';
      }
      setEditingDiscount({
        ...discount,
        customer_name: customerName,
        product_name: productName
      });
    } catch (err) {
      setError(err.message || 'خطا در بارگذاری اطلاعات تخفیف');
    }
  };

  if (isAdmin === false) return <Navigate to="/products" />;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">مدیریت تخفیف‌ها</h1>
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">{editingDiscount ? 'ویرایش تخفیف' : 'افزودن تخفیف'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="کد تخفیف"
              value={editingDiscount ? editingDiscount.code || '' : newDiscount.code}
              onChange={(e) =>
                editingDiscount
                  ? setEditingDiscount({ ...editingDiscount, code: e.target.value })
                  : setNewDiscount({ ...newDiscount, code: e.target.value })
              }
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="درصد تخفیف (الزامی)"
              value={editingDiscount ? editingDiscount.percent : newDiscount.percent}
              onChange={(e) =>
                editingDiscount
                  ? setEditingDiscount({ ...editingDiscount, percent: e.target.value })
                  : setNewDiscount({ ...newDiscount, percent: e.target.value })
              }
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="number"
              placeholder="حداکثر تخفیف"
              value={editingDiscount ? editingDiscount.max_discount || '' : newDiscount.max_discount}
              onChange={(e) =>
                editingDiscount
                  ? setEditingDiscount({ ...editingDiscount, max_discount: e.target.value })
                  : setNewDiscount({ ...newDiscount, max_discount: e.target.value })
              }
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="relative">
              {(editingDiscount?.product_id || newDiscount.product_id) ? (
                <div className="p-2 border rounded bg-gray-50 flex justify-between items-center">
                  <span>{editingDiscount ? editingDiscount.product_name : newDiscount.product_name}</span>
                  <button onClick={removeProduct} className="text-red-500 hover:underline">
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
                              console.log('Dropdown item clicked:', product);
                              selectProduct(product);
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
            <div className="relative">
              {(editingDiscount?.customer_id || newDiscount.customer_id) ? (
                <div className="p-2 border rounded bg-gray-50 flex justify-between items-center">
                  <span>{editingDiscount ? editingDiscount.customer_name : newDiscount.customer_name}</span>
                  <button onClick={removeCustomer} className="text-red-500 hover:underline">
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
          </div>
          <button
            onClick={editingDiscount ? handleEditDiscount : handleAddDiscount}
            className="mt-4 bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600 transition w-full"
          >
            {editingDiscount ? 'ویرایش' : 'افزودن'}
          </button>
          {editingDiscount && (
            <button
              onClick={() => setEditingDiscount(null)}
              className="mt-2 bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition w-full"
            >
              لغو ویرایش
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-right">کد</th>
                <th className="p-3 text-right">درصد</th>
                <th className="p-3 text-right">حداکثر تخفیف</th>
                <th className="p-3 text-right">محصول</th>
                <th className="p-3 text-right">مشتری</th>
                <th className="p-3 text-right">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount) => (
                <tr key={discount.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{discount.code || 'N/A'}</td>
                  <td className="p-3">{discount.percent}%</td>
                  <td className="p-3">{discount.max_discount ? discount.max_discount.toLocaleString() : 'N/A'} تومان</td>
                  <td className="p-3">
                    {discount.product_id ? <FetchProductName productId={discount.product_id} /> : 'N/A'}
                  </td>
                  <td className="p-3">
                    {discount.customer_id ? <FetchCustomerName customerId={discount.customer_id} /> : 'عمومی'}
                  </td>
                  <td className="p-3 flex space-x-2">
                    <button
                      onClick={() => handleEditClick(discount)}
                      className="text-blue-500 hover:underline"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id)}
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
      </div>
    </div>
  );
};

const FetchProductName = ({ productId }) => {
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const product = await getProductById(productId);
        setProductName(product?.name || `محصول #${productId}`);
      } catch {
        setProductName(`محصول #${productId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  if (loading) return 'در حال بارگذاری...';
  return productName;
};

const FetchCustomerName = ({ customerId }) => {
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const user = await getUserById(customerId);
        setCustomerName(`${user?.name || ''} ${user?.last_name || ''}`.trim() || `مشتری #${customerId}`);
      } catch {
        setCustomerName(`مشتری #${customerId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [customerId]);

  if (loading) return 'در حال بارگذاری...';
  return customerName;
};

export default AdminDiscounts;