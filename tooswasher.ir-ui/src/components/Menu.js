import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getPages} from '../api';
import {getUserProfile, getToken, removeToken } from '../auth'

const Menu = ({ refreshKey }) => {
  const [menuPages, setMenuPages] = useState([]);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // بررسی آیا کاربر وارد سیستم شده است
    const token = getToken();
    if (token) {
      setIsLoggedIn(true);
      // دریافت اطلاعات کاربر برای نمایش نام کاربری
      getUserProfile()
        .then((user) => {
          setUserName(user.name || user.username); // استفاده از نام یا نام کاربری
        })
        .catch((err) => {
          console.error('خطا در دریافت اطلاعات کاربر:', err);
          removeToken(); // حذف توکن نامعتبر
          setIsLoggedIn(false);
        });
    } else {
      setIsLoggedIn(false);
    }

    // دریافت صفحات منو
    getPages()
      .then((data) => {
        setMenuPages(data.filter((page) => page.is_in_menu));
      })
      .catch((err) => {
        console.error('خطا در دریافت صفحات:', err);
        setError('خطا در بارگذاری منو');
      });
  }, [refreshKey]);

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setUserName('');
    window.location.href = '/login'; // انتقال به صفحه ورود
  };

  return (
    <nav className="menu">
      <div className="menu-container">
        <button className="menu-button">
          <NavLink to="/" exact activeClassName="active">
            خانه
          </NavLink>
        </button>
        <button className="menu-button">
          <NavLink to="/page/pages" activeClassName="active">
            لیست صفحات
          </NavLink>
        </button>
        <button className="menu-button">
          <NavLink to="/page/create" activeClassName="active">
            ایجاد صفحه
          </NavLink>
        </button>
        {isLoggedIn ? (
          <>
            <button className="menu-button">
              <NavLink to="/profile" activeClassName="active">
                {userName}
              </NavLink>
            </button>
            <button className="menu-button" onClick={handleLogout}>
              خروج
            </button>
          </>
        ) : (
          <>
            <button className="menu-button">
              <NavLink to="/login" activeClassName="active">
                ورود
              </NavLink>
            </button>
            <button className="menu-button">
              <NavLink to="/register" activeClassName="active">
                ثبت نام
              </NavLink>
            </button>
          </>
        )}
        {error ? (
          <span className="menu-error">{error}</span>
        ) : (
          menuPages.map((page) => (
            <button key={page.id} className="menu-button">
              <NavLink
                to={`/${page.name.toLowerCase().replace(/\s+/g, '-')}`} // تطبیق مسیر
                activeClassName="active"
              >
                {page.name}
              </NavLink>
            </button>
          ))
        )}
      </div>
    </nav>
  );
};

export default Menu;