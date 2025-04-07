/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getUserProfile } from '../api/api';
import { isAuthenticated } from '../api/auth';

const sideNavbarStyles = css`
  position: fixed;
  top: 0;
  right: 0;
  width: 250px;
  height: 100%;
  background: #ffffff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  transform: translateX(100%);
  transition: transform 0.3s ease-in-out;
  &.open {
    transform: translateX(0);
  }
  direction: rtl;
`;

const SideNavbar = ({ onClose }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (isAuthenticated()) {
        try {
          const user = await getUserProfile();
          setIsAdmin(user.role === 'admin');
        } catch (err) {
          console.error('Error fetching user role:', err);
        }
      }
    };
    fetchUserRole();
  }, []);

  return (
    <div css={sideNavbarStyles} className="open">
      <div className="p-4">
        <button onClick={onClose} className="text-gray-600 hover:text-gray-800 mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <ul className="space-y-4">
          {isAdmin && (
            <>
              <li>
                <Link to="/admin/products" onClick={onClose} className="text-indigo-600 hover:underline">
                  مدیریت محصولات
                </Link>
              </li>
              <li>
                <Link to="/admin/categories" onClick={onClose} className="text-indigo-600 hover:underline">
                  مدیریت دسته‌بندی‌ها
                </Link>
              </li>
              <li>
                <Link to="/admin/discounts" onClick={onClose} className="text-indigo-600 hover:underline">
                  مدیریت تخفیف‌ها
                </Link>
              </li>
              <li>
                <Link to="/admin/users" onClick={onClose} className="text-indigo-600 hover:underline">
                  مدیریت کاربران
                </Link>
              </li>
            </>
          )}
          <li>
            <Link to="/events" onClick={onClose} className="text-indigo-600 hover:underline">
              رویدادها
            </Link>
          </li>
          <li>
            <Link to="/admin/pages" onClick={onClose} className="text-indigo-600 hover:underline">
              مدیریت صفحات
            </Link>
          </li>
          <li>
            <Link to="/admin/file" onClick={onClose} className="text-indigo-600 hover:underline">
              مدیریت فایل
            </Link>
          </li>
          <li>
            <Link to="/admin/option" onClick={onClose} className="text-indigo-600 hover:underline">
              مدیریت تنظیمات
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SideNavbar;