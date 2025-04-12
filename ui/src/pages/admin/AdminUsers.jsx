/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { 
  getAllUsers, 
  searchUsersByUsername, 
  searchUsersByEmail, 
  searchUsersByNationalId, 
  searchUsersByName, 
  searchUsersByPhoneNumber, 
  adminUpdateUser, 
  deleteUser, 
  getUserProfile, 
  registerUser 
} from '../../api/api';
import { isAuthenticated } from '../../api/auth';
import { containerStyles } from '../style';

const popupStyles = css`
  position: fixed;
  top: 135px; /* Match containerStyles padding-top */
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Align to top to respect padding */
  z-index: 100;
`;

const popupContentStyles = css`
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
  direction: rtl;
  max-height: 80vh; /* Prevent overflow */
  overflow-y: auto; /* Scroll if content exceeds */
`;

const searchBarStyles = css`
  width: 100%;
  max-width: 400px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
`;

const tableSectionStyles = css`
  margin-bottom: 2rem;
`;

const tableTitleStyles = css`
  font-size: 1.5rem;
  font-weight: bold;
  color: #374151;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
`;

const AdminUsers = () => {
  const [users, setUsers] = useState({ admin: [], staff: [], customer: [] });
  const [filteredUsers, setFilteredUsers] = useState({ admin: [], staff: [], customer: [] });
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    last_name: '',
    national_id: '',
    address: '',
    state: '',
    city: '',
    phone_number: '',
    role: 'customer',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMethod, setSearchMethod] = useState('username'); // Default search by username

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isAuthenticated()) {
          setIsAdmin(false);
          return;
        }
        const user = await getUserProfile();
        setIsAdmin(user.role === 'admin');
        if (user.role !== 'admin') return;

        const data = await getAllUsers();
        const groupedUsers = {
          admin: data.filter(user => user.role === 'admin'),
          staff: data.filter(user => user.role === 'staff'),
          customer: data.filter(user => user.role === 'customer'),
        };
        setUsers(groupedUsers);
        setFilteredUsers(groupedUsers);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری کاربران');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const search = async () => {
      if (searchTerm.trim() === '') {
        setFilteredUsers(users);
        return;
      }
      try {
        let data;
        switch (searchMethod) {
          case 'username':
            data = await searchUsersByUsername(searchTerm);
            break;
          case 'email':
            data = await searchUsersByEmail(searchTerm);
            break;
          case 'national_id':
            data = await searchUsersByNationalId(searchTerm);
            break;
          case 'name':
            data = await searchUsersByName(searchTerm);
            break;
          case 'phone_number':
            data = await searchUsersByPhoneNumber(searchTerm);
            break;
          default:
            data = await searchUsersByUsername(searchTerm);
        }
        const groupedUsers = {
          admin: data.filter(user => user.role === 'admin'),
          staff: data.filter(user => user.role === 'staff'),
          customer: data.filter(user => user.role === 'customer'),
        };
        setFilteredUsers(groupedUsers);
      } catch (err) {
        setError(err.message || 'خطا در جستجو');
      }
    };
    search();
  }, [searchTerm, searchMethod, users]);

  const handleSaveUser = async () => {
    try {
      if (selectedUser) {
        const updated = await adminUpdateUser(selectedUser.id,{
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          last_name: formData.last_name,
          national_id: formData.national_id,
          address: formData.address,
          state: formData.state,
          city: formData.city,
          phone_number: formData.phone_number,
          role: formData.role
        });
        setUsers({
          admin: users.admin.map(u => u.id === updated.id ? updated : u),
          staff: users.staff.map(u => u.id === updated.id ? updated : u),
          customer: users.customer.map(u => u.id === updated.id ? updated : u),
        });
        setFilteredUsers({
          admin: filteredUsers.admin.map(u => u.id === updated.id ? updated : u),
          staff: filteredUsers.staff.map(u => u.id === updated.id ? updated : u),
          customer: filteredUsers.customer.map(u => u.id === updated.id ? updated : u),
        });
      } else {
        const newUser = await registerUser(formData);
        setUsers({
          ...users,
          [newUser.role]: [...users[newUser.role], newUser],
        });
        setFilteredUsers({
          ...filteredUsers,
          [newUser.role]: [...filteredUsers[newUser.role], newUser],
        });
      }
      setSelectedUser(null);
      setShowAddPopup(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        name: '',
        last_name: '',
        national_id: '',
        address: '',
        state: '',
        city: '',
        phone_number: '',
        role: 'customer',
      });
      setError(null);
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.detail;
        const errorMessage = validationErrors
          .map((e) => `خطا در ${e.loc.join(' -> ')}: ${e.msg}`)
          .join(', ');
        setError(errorMessage || 'خطا در ذخیره کاربر: داده‌ها نامعتبر است');
      } else {
        setError(err.message || 'خطا در ذخیره کاربر');
      }
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('آیا مطمئن هستید؟')) {
      try {
        await deleteUser(id);
        const updatedUsers = {
          admin: users.admin.filter(u => u.id !== id),
          staff: users.staff.filter(u => u.id !== id),
          customer: users.customer.filter(u => u.id !== id),
        };
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setSelectedUser(null);
        setShowAddPopup(false);
        setError(null);
      } catch (err) {
        setError(err.message || 'خطا در حذف کاربر');
      }
    }
  };

  if (isAdmin === null) return <div>در حال بارگذاری...</div>;
  if (isAdmin === false) return <Navigate to="/users" />;
  if (error && !showAddPopup) return <div className="text-center text-red-500 mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">مدیریت کاربران</h1>
          <button
            onClick={() => setShowAddPopup(true)}
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
          >
            افزودن کاربر
          </button>
        </div>
        <div className="flex gap-4 mb-6">
          <select
            value={searchMethod}
            onChange={(e) => setSearchMethod(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="username">نام کاربری</option>
            <option value="email">ایمیل</option>
            <option value="national_id">کد ملی</option>
            <option value="name">نام یا نام خانوادگی</option>
            <option value="phone_number">شماره تلفن</option>
          </select>
          <input
            type="text"
            placeholder={`جستجو بر اساس ${searchMethod === 'username' ? 'نام کاربری' : searchMethod === 'email' ? 'ایمیل' : searchMethod === 'national_id' ? 'کد ملی' : searchMethod === 'name' ? 'نام یا نام خانوادگی' : 'شماره تلفن'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            css={searchBarStyles}
          />
        </div>
        {['admin', 'staff', 'customer'].map((role) => (
          <div key={role} css={tableSectionStyles}>
            <h2 css={tableTitleStyles}>{role === 'admin' ? 'مدیران' : role === 'staff' ? 'کارکنان' : 'مشتریان'}</h2>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-md">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-3 text-right">نام کاربری</th>
                    <th className="p-3 text-right">نام</th>
                    <th className="p-3 text-right">نام خانوادگی</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers[role].map((user) => (
                    <tr
                      key={user.id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedUser(user);
                        setFormData({
                          username: user.username || '',
                          email: user.email || '',
                          password: '',
                          name: user.name || '',
                          last_name: user.last_name || '',
                          national_id: user.national_id || '',
                          address: user.address || '',
                          state: user.state || '',
                          city: user.city || '',
                          phone_number: user.phone_number || '',
                          role: user.role || 'customer',
                        });
                        setShowAddPopup(true);
                      }}
                    >
                      <td className="p-3">{user.username || 'بدون نام کاربری'}</td>
                      <td className="p-3">{user.name || 'بدون نام'}</td>
                      <td className="p-3">{user.last_name || 'بدون نام خانوادگی'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      {(selectedUser || showAddPopup) && (
        <div css={popupStyles} onClick={() => { setSelectedUser(null); setShowAddPopup(false); setError(null); }}>
          <div css={popupContentStyles} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">
              {selectedUser ? 'ویرایش کاربر' : 'افزودن کاربر'}
            </h3>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <form onSubmit={(e) => { e.preventDefault(); handleSaveUser(); }}>
              <input
                type="text"
                placeholder="نام کاربری"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
                required
              />
              <input
                type="email"
                placeholder="ایمیل"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
                required={!selectedUser}
              />
              <input
                type="password"
                placeholder="رمز عبور"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
                required
                />
              <input
                type="text"
                placeholder="نام"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
              />
              <input
                type="text"
                placeholder="نام خانوادگی"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
              />
              <input
                type="text"
                placeholder="کد ملی"
                value={formData.national_id}
                onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
                required={!selectedUser}
              />
              <input
                type="text"
                placeholder="آدرس"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
              />
              <input
                type="text"
                placeholder="استان"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
              />
              <input
                type="text"
                placeholder="شهر"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
              />
              <input
                type="text"
                placeholder="شماره تلفن"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
                required
              >
                <option value="customer">مشتری</option>
                <option value="staff">کارمند</option>
                <option value="admin">مدیر</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  {selectedUser ? 'به‌روزرسانی' : 'ذخیره'}
                </button>
                {selectedUser && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    حذف
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedUser(null); setShowAddPopup(false); setError(null); }}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  لغو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;