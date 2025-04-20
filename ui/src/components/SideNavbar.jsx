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
  padding: 1rem;
  direction: rtl;
  
  &.open {
    transform: translateX(0);
  }

  .nav-item {
    transition: all 0.2s ease;
    padding: 0.5rem;
    border-radius: 0.375rem;
    
    &:hover {
      background: #f3f4f6;
    }
  }

  .sub-item {
    padding-right: 1.5rem;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 4px;
      background: #4f46e5;
      border-radius: 50%;
    }
  }
`;

const SideNavbar = ({ onClose }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isShopExpanded, setIsShopExpanded] = useState(false);
  const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false);

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
        <button 
          onClick={onClose} 
          className="text-gray-600 hover:text-gray-800 mb-4"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <ul className="space-y-2">
          {isAdmin && (
            <>
              <li className="nav-item">
                <div 
                  className="flex items-center justify-between cursor-pointer text-gray-700"
                  onClick={() => setIsShopExpanded(!isShopExpanded)}
                >
                  <span className="font-medium">فروشگاه</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform ${isShopExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isShopExpanded && (
                  <ul className="mt-2 space-y-2">
                    <li className="sub-item">
                      <Link 
                        to="/admin/order" 
                        onClick={onClose} 
                        className="block text-gray-600 hover:text-indigo-600"
                      >
                        مدیریت سفارش‌ها
                      </Link>
                    </li>
                    <li className="sub-item">
                      <Link 
                        to="/admin/discounts" 
                        onClick={onClose} 
                        className="block text-gray-600 hover:text-indigo-600"
                      >
                        مدیریت تخفیف‌ها
                      </Link>
                    </li>
                    <li className="sub-item">
                      <Link 
                        to="/admin/categories" 
                        onClick={onClose} 
                        className="block text-gray-600 hover:text-indigo-600"
                      >
                        مدیریت دسته‌بندی‌ها
                      </Link>
                    </li>
                    <li className="sub-item">
                      <Link 
                        to="/admin/products" 
                        onClick={onClose} 
                        className="block text-gray-600 hover:text-indigo-600"
                      >
                        مدیریت محصولات
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
              <li className="nav-item">
                <Link 
                  to="/admin/users" 
                  onClick={onClose} 
                  className="block text-gray-700 hover:text-indigo-600"
                >
                  مدیریت کاربران
                </Link>
              </li>
            </>
          )}
          <li className="nav-item">
            <Link 
              to="/events" 
              onClick={onClose} 
              className="block text-gray-700 hover:text-indigo-600"
            >
              رویدادها
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/admin/pages" 
              onClick={onClose} 
              className="block text-gray-700 hover:text-indigo-600"
            >
              مدیریت صفحات
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/admin/file" 
              onClick={onClose} 
              className="block text-gray-700 hover:text-indigo-600"
            >
              مدیریت فایل
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/admin/option" 
              onClick={onClose} 
              className="block text-gray-700 hover:text-indigo-600"
            >
              مدیریت تنظیمات
            </Link>
          </li>
          {/* Workflow Section */}
          <li className="nav-item">
            <div 
              className="flex items-center justify-between cursor-pointer text-gray-700"
              onClick={() => setIsWorkflowExpanded(!isWorkflowExpanded)}
            >
              <span className="font-medium">گردش کار</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${isWorkflowExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {isWorkflowExpanded && (
              <ul className="mt-2 space-y-2">
                <li className="sub-item">
                  <Link 
                    to="/admin/workflow/templates" 
                    onClick={onClose} 
                    className="block text-gray-600 hover:text-indigo-600"
                  >
                    الگوی گردش کار
                  </Link>
                </li>
                <li className="sub-item">
                  <Link 
                    to="/admin/workflow" 
                    onClick={onClose} 
                    className="block text-gray-600 hover:text-indigo-600"
                  >
                    گردش کارها
                  </Link>
                </li>
                <li className="sub-item">
                  <Link 
                    to="/admin/workflow" 
                    onClick={onClose} 
                    className="block text-gray-600 hover:text-indigo-600"
                  >
                    گردش کارهای من
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SideNavbar;