/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { getUserProfile, updateUser, changePassword, requestPasswordReset } from '../api/api';
import { logoutUser } from '../api/auth';

const popupOverlayStyles = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const popupContentStyles = css`
  background-color: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const inputStyles = css`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const buttonStyles = css`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background-color: #3b82f6;
  color: white;
  margin-right: 0.5rem;
  &:hover {
    background-color: #2563eb;
  }
`;

const logoutButtonStyles = css`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background-color: #ef4444;
  color: white;
  margin-right: 0.5rem;
  &:hover {
    background-color: #dc2626;
  }
`;

const cancelButtonStyles = css`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background-color: #6b7280;
  color: white;
  &:hover {
    background-color: #4b5563;
  }
`;

const sectionStyles = css`
  margin-bottom: 1.5rem;
`;

const UserProfilePopup = ({ onClose }) => {
  const [userData, setUserData] = useState({
    name: '',
    last_name: '',
    username: '',
    email: '',
    phone_number: '',
    address: '', // Added
    state: '',   // Added
    city: '',    // Added
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (onClose) {
      fetchUserProfile();
    }
  }, [onClose]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      setUserData({
        name: profile.name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '', // Added
        state: profile.state || '',     // Added
        city: profile.city || '',       // Added
      });
      setError('');
      setSuccess('');
    } catch (err) {
      setError('خطا در بارگذاری اطلاعات کاربر');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateUser(userData);
      setSuccess('پروفایل با موفقیت به‌روزرسانی شد');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'خطا در به‌روزرسانی پروفایل');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('رمزهای جدید مطابقت ندارند');
      return;
    }
    try {
      setLoading(true);
      await changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      setSuccess('رمز عبور با موفقیت تغییر کرد');
      setError('');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setError(err.response?.data?.detail || 'خطا در تغییر رمز عبور');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    try {
      setLoading(true);
      await requestPasswordReset(userData.email);
      setSuccess('لینک بازنشانی رمز عبور به ایمیل شما ارسال شد');
      setError('');
    } catch (err) {
      setError('خطا در درخواست بازنشانی رمز عبور');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    onClose();
  };

  if (!onClose) return null;

  return (
    <div css={popupOverlayStyles} onClick={onClose}>
      <div css={popupContentStyles} onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">ویرایش پروفایل</h2>
        
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}
        
        {/* Profile Edit Form */}
        <div css={sectionStyles}>
          <h3 className="text-lg font-semibold mb-2">اطلاعات شخصی</h3>
          <form onSubmit={handleProfileUpdate}>
            <input
              css={inputStyles}
              type="text"
              name="name"
              value={userData.name}
              onChange={handleInputChange}
              placeholder="نام"
              disabled={loading}
            />
            <input
              css={inputStyles}
              type="text"
              name="last_name"
              value={userData.last_name}
              onChange={handleInputChange}
              placeholder="نام خانوادگی"
              disabled={loading}
            />
            <input
              css={inputStyles}
              type="text"
              name="username"
              value={userData.username}
              onChange={handleInputChange}
              placeholder="نام کاربری"
              disabled={loading}
            />
            <input
              css={inputStyles}
              type="email"
              name="email"
              value={userData.email}
              onChange={handleInputChange}
              placeholder="ایمیل"
              disabled={loading}
            />
            <input
              css={inputStyles}
              type="tel"
              name="phone_number"
              value={userData.phone_number}
              onChange={handleInputChange}
              placeholder="شماره تلفن"
              disabled={loading}
            />
            <input
              css={inputStyles}
              type="text"
              name="address"
              value={userData.address}
              onChange={handleInputChange}
              placeholder="آدرس"
              disabled={loading}
            />
            <input
              css={inputStyles}
              type="text"
              name="state"
              value={userData.state}
              onChange={handleInputChange}
              placeholder="استان"
              disabled={loading}
            />
            <input
              css={inputStyles}
              type="text"
              name="city"
              value={userData.city}
              onChange={handleInputChange}
              placeholder="شهر"
              disabled={loading}
            />
            <button css={buttonStyles} type="submit" disabled={loading}>
              {loading ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی پروفایل'}
            </button>
          </form>
        </div>

        {/* Password Change Form */}
        <div css={sectionStyles}>
          <h3 className="text-lg font-semibold mb-2">تغییر رمز عبور</h3>
          <form onSubmit={handlePasswordUpdate}>
            <input
              css={inputStyles}
              type="password"
              name="old_password"
              value={passwordData.old_password}
              onChange={handlePasswordChange}
              placeholder="رمز عبور فعلی"
              disabled={loading}
            />
            <input
              css={inputStyles}
              type="password"
              name="new_password"
              value={passwordData.new_password}
              onChange={handlePasswordChange}
              placeholder="رمز عبور جدید"
              disabled={loading}
            />
            <input
              css={inputStyles}
              type="password"
              name="confirm_password"
              value={passwordData.confirm_password}
              onChange={handlePasswordChange}
              placeholder="تأیید رمز عبور جدید"
              disabled={loading}
            />
            <button css={buttonStyles} type="submit" disabled={loading}>
              {loading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
            </button>
          </form>
        </div>

        {/* Password Reset Request */}
        <div css={sectionStyles}>
          <h3 className="text-lg font-semibold mb-2">بازنشانی رمز عبور</h3>
          <button css={buttonStyles} onClick={handlePasswordResetRequest} disabled={loading || !userData.email}>
            {loading ? 'در حال ارسال...' : 'ارسال لینک بازنشانی'}
          </button>
        </div>

        {/* Logout and Close Buttons */}
        <div className="flex justify-between">
          <button css={logoutButtonStyles} onClick={handleLogout} disabled={loading}>
            خروج
          </button>
          <button css={cancelButtonStyles} onClick={onClose} disabled={loading}>
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePopup;