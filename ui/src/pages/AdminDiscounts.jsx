/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getDiscounts, createDiscount, updateDiscount, deleteDiscount, getUserProfile } from '../api/api';
import { isAuthenticated } from '../api/auth';
import { containerStyles } from './style';

const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [newDiscount, setNewDiscount] = useState({ code: '', percent: '', max_discount: '', product_id: '' });
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);

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

  const handleAddDiscount = async () => {
    try {
      const discount = await createDiscount({
        ...newDiscount,
        percent: parseFloat(newDiscount.percent),
        max_discount: parseFloat(newDiscount.max_discount) || 0,
        product_id: parseInt(newDiscount.product_id) || null,
      });
      setDiscounts([...discounts, discount]);
      setNewDiscount({ code: '', percent: '', max_discount: '', product_id: '' });
    } catch (err) {
      setError(err.message || 'خطا در افزودن تخفیف');
    }
  };

  const handleEditDiscount = async () => {
    try {
      const updated = await updateDiscount(editingDiscount.id, {
        ...editingDiscount,
        percent: parseFloat(editingDiscount.percent),
        max_discount: parseFloat(editingDiscount.max_discount) || 0,
        product_id: parseInt(editingDiscount.product_id) || null,
      });
      setDiscounts(discounts.map((d) => (d.id === updated.id ? updated : d)));
      setEditingDiscount(null);
    } catch (err) {
      setError(err.message || 'خطا در ویرایش تخفیف');
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
              value={editingDiscount ? editingDiscount.code : newDiscount.code}
              onChange={(e) =>
                editingDiscount
                  ? setEditingDiscount({ ...editingDiscount, code: e.target.value })
                  : setNewDiscount({ ...newDiscount, code: e.target.value })
              }
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="درصد تخفیف"
              value={editingDiscount ? editingDiscount.percent : newDiscount.percent}
              onChange={(e) =>
                editingDiscount
                  ? setEditingDiscount({ ...editingDiscount, percent: e.target.value })
                  : setNewDiscount({ ...newDiscount, percent: e.target.value })
              }
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="حداکثر تخفیف"
              value={editingDiscount ? editingDiscount.max_discount : newDiscount.max_discount}
              onChange={(e) =>
                editingDiscount
                  ? setEditingDiscount({ ...editingDiscount, max_discount: e.target.value })
                  : setNewDiscount({ ...newDiscount, max_discount: e.target.value })
              }
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              placeholder="شناسه محصول"
              value={editingDiscount ? editingDiscount.product_id : newDiscount.product_id}
              onChange={(e) =>
                editingDiscount
                  ? setEditingDiscount({ ...editingDiscount, product_id: e.target.value })
                  : setNewDiscount({ ...newDiscount, product_id: e.target.value })
              }
              className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
                <th className="p-3 text-right">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((discount) => (
                <tr key={discount.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{discount.code}</td>
                  <td className="p-3">{discount.percent}%</td>
                  <td className="p-3">{discount.max_discount ? discount.max_discount.toLocaleString() : 'N/A'} تومان</td>
                  <td className="p-3">{discount.product_id || 'N/A'}</td>
                  <td className="p-3 flex space-x-2">
                    <button
                      onClick={() => setEditingDiscount(discount)}
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

export default AdminDiscounts;