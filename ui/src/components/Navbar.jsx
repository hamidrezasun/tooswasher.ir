/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isAuthenticated, logoutUser } from '../api/auth';
import { getOptionByName, getUserProfile, getPages, getCart } from '../api/api';
import LoginPopup from './LoginPopup';
import RegisterPopup from './RegisterPopup';
import CategoryPopup from './CategoryPopup';
import SearchPopup from './SearchPopup';
import SideNavbar from './SideNavbar';
import CartPopup from './CartPopup';
import UserProfilePopup from './UserProfilePopup';
import {
  navbarStyles,
  containerStyles,
  topBarStyles,
  logoStyles,
  searchStyles,
  authCartStyles,
  loginButtonStyles,
  registerButtonStyles,
  cartButtonStyles,
  categoryButtonStyles,
  searchButtonStyles,
  toggleButtonStyles,
  userInfoStyles,
  menuStyles,
  menuItemStyles,
} from './NavbarStyles';

const clickableUserInfoStyles = css`
  ${userInfoStyles};
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  &:hover {
    background-color: #f3f4f6;
  }
`;

const ordersButtonStyles = css`
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  white-space: nowrap;
  min-width: 100px;
  background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
  &:hover {
    background: linear-gradient(135deg, #6d28d9 0%, #8b5cf6 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  }
  @media (max-width: 640px) {
    padding: 0.4rem 0.8rem;
    font-size: 0.75rem;
    min-width: 80px;
  }
`;

const Navbar = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSideNavbarOpen, setIsSideNavbarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [menuPages, setMenuPages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [loginMessage, setLoginMessage] = useState('');
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [companyName, setCompanyName] = useState('company_name');
  const [companyColorCode, setCompanyColorCode] = useState('#2563eb');
  const [logoUrl, setLogoUrl] = useState('');

  const fetchCart = async () => {
    if (isAuthenticated()) {
      try {
        const cart = await getCart();
        setCartCount(cart.length || 0);
      } catch (err) {
        console.error('Failed to fetch cart:', err);
      }
    } else {
      setCartCount(0);
    }
  };

  const handleAddToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated() || !productId) return;
    try {
      await fetch(`/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      await fetchCart();
      setLoginMessage('محصول به سبد خرید اضافه شد!');
      setShowLoginMessage(true);
      setTimeout(() => setShowLoginMessage(false), 3000);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setLoginMessage('خطا در افزودن به سبد خرید');
      setShowLoginMessage(true);
      setTimeout(() => setShowLoginMessage(false), 3000);
    }
  };

  useEffect(() => {
    if (logoUrl) {
      const favicon = document.getElementById('favicon');
      if (favicon) {
        favicon.href = logoUrl;
      }
      
      const appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']");
      if (appleTouchIcon) {
        appleTouchIcon.href = logoUrl;
      }
    }
  }, [logoUrl]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyNameOption = await getOptionByName('company_name');
        const companyColorCodeOption = await getOptionByName('company_color_code');
        const logoUrlOption = await getOptionByName('logo_url');
        if (companyNameOption) setCompanyName(companyNameOption.option_value);
        if (companyColorCodeOption) setCompanyColorCode(companyColorCodeOption.option_value);
        if (logoUrlOption) setLogoUrl(logoUrlOption.option_value);
      } catch (error) {
        console.error("Failed to fetch company data:", error);
      }

      if (isAuthenticated()) {
        try {
          const profile = await getUserProfile();
          setUser(profile);
          await fetchCart();
        } catch (err) {
          console.error('Failed to fetch user profile or cart:', err);
          logoutUser();
        }
      } else {
        setUser(null);
        setCartCount(0);
      }
      try {
        const pages = await getPages();
        const menuItems = pages.filter((page) => page.is_in_menu === true);
        setMenuPages(menuItems);
      } catch (err) {
        console.error('Failed to fetch pages:', err);
      }
    };
    fetchData();
  }, []);

  const handleLoginSuccess = async () => {
    try {
      const profile = await getUserProfile();
      setUser(profile);
      await fetchCart();
      setLoginMessage('ورود با موفقیت انجام شد!');
      setShowLoginMessage(true);
      setTimeout(() => setShowLoginMessage(false), 3000);
    } catch (err) {
      console.error('Failed to fetch profile after login:', err);
      logoutUser();
      setUser(null);
      setCartCount(0);
      setLoginMessage('خطا در بارگذاری اطلاعات کاربر، لطفاً دوباره وارد شوید');
      setShowLoginMessage(true);
      setTimeout(() => setShowLoginMessage(false), 3000);
    }
  };

  const isStaffOrAdmin = user && (user.role === 'staff' || user.role === 'admin');

  const dynamicLogoStyles = css`
    ${logoStyles};
    color: ${companyColorCode};
    display: flex;
    align-items: center;
    gap: 0.5rem;
    &:hover {
      color: ${adjustColor(companyColorCode, -20)};
    }
  `;

  const logoImageStyles = css`
    max-height: 40px;
    max-width: 40px;
    height: auto;
    width: auto;
    object-fit: contain;
  `;

  const dynamicCategoryButtonStyles = css`
    ${categoryButtonStyles};
    background: linear-gradient(135deg, ${companyColorCode} 0%, ${adjustColor(companyColorCode, 20)} 100%);
    &:hover {
      background: linear-gradient(135deg, ${adjustColor(companyColorCode, -20)} 0%, ${companyColorCode} 100%);
    }
  `;

  function adjustColor(color, amount) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = R + amount;
    G = G + amount;
    B = B + amount;

    R = R < 0 ? 0 : R > 255 ? 255 : R;
    G = G < 0 ? 0 : G > 255 ? 255 : G;
    B = B < 0 ? 0 : B > 255 ? 255 : B;

    const RR = R.toString(16).length === 1 ? "0" + R.toString(16) : R.toString(16);
    const GG = G.toString(16).length === 1 ? "0" + G.toString(16) : G.toString(16);
    const BB = B.toString(16).length === 1 ? "0" + B.toString(16) : B.toString(16);

    return "#" + RR + GG + BB;
  }

  return (
    <nav css={navbarStyles}>
      <div css={containerStyles}>
        <div css={topBarStyles}>
          <Link to="/" css={dynamicLogoStyles}>
            {logoUrl && (
              <img
                src={logoUrl || 'https://via.placeholder.com/40'}
                alt={`${companyName} logo`}
                css={logoImageStyles}
              />
            )}
            {companyName}
          </Link>
          
          <div css={authCartStyles}>
            {user && (
              <Link to="/orders" css={ordersButtonStyles}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                سفارش‌ها
              </Link>
            )}
            
            {user ? (
              <span 
                css={clickableUserInfoStyles} 
                onClick={() => setIsProfileOpen(true)}
              >
                {user.name || user.username} {user.last_name || ''}
              </span>
            ) : (
              <>
                <button css={loginButtonStyles} onClick={() => setIsLoginOpen(true)}>
                  ورود
                </button>
                <button css={registerButtonStyles} onClick={() => setIsRegisterOpen(true)}>
                  ثبت‌نام
                </button>
              </>
            )}
            <button css={cartButtonStyles} onClick={() => setIsCartOpen(true)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h16l-1.5 7H6L4 4zm0 0l-1 4v9h18v-9l-1-4m-2 13a2 2 0 100-4 2 2 0 000 4zm-8 0a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span>سبد خرید</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div css={menuStyles}>
          {isStaffOrAdmin && (
            <button css={toggleButtonStyles} onClick={() => setIsSideNavbarOpen(true)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              منو
            </button>
          )}
          <Link to="/" css={menuItemStyles}>
            خانه
          </Link>
          <Link to="/products" css={menuItemStyles}>
            محصولات
          </Link>
          {menuPages.map((page) => (
            <Link
              key={page.id}
              to={`/pages/${encodeURIComponent(page.name.replace(/\s+/g, '-'))}`}
              css={menuItemStyles}
            >
              {page.name}
            </Link>
          ))}
          <button css={dynamicCategoryButtonStyles} onClick={() => setIsCategoryOpen(true)}>
            دسته‌بندی‌ها
          </button>
        </div>
      </div>
      {showLoginMessage && (
        <div className="fixed top-4 right-4 bg-green-100 text-green-800 p-2 rounded z-50">
          {loginMessage}
        </div>
      )}
      {isLoginOpen && (
        <LoginPopup
          onClose={() => setIsLoginOpen(false)}
          setIsRegisterOpen={setIsRegisterOpen}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {isRegisterOpen && <RegisterPopup onClose={() => setIsRegisterOpen(false)} setIsLoginOpen={setIsLoginOpen} />}
      {isCategoryOpen && <CategoryPopup onClose={() => setIsCategoryOpen(false)} />}
      {isSearchOpen && <SearchPopup onClose={() => setIsSearchOpen(false)} />}
      {isStaffOrAdmin && isSideNavbarOpen && <SideNavbar onClose={() => setIsSideNavbarOpen(false)} />}
      {isCartOpen && <CartPopup onClose={() => setIsCartOpen(false)} />}
      {isProfileOpen && <UserProfilePopup onClose={() => setIsProfileOpen(false)} />}
    </nav>
  );
};

export default Navbar;