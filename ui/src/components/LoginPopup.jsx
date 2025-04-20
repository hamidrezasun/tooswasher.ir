/** @jsxImportSource @emotion/react */
import { useState } from 'react';
import { loginUser } from '../api/api';
import { css } from '@emotion/react';

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
  z-index: 100;
`;

const popupContentStyles = css`
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 400px;
  direction: rtl;
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
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.375rem;
  background-color: #3b82f6;
  color: white;
  margin-bottom: 1rem;
  &:hover {
    background-color: #2563eb;
  }
`;

const linkStyles = css`
  color: #2563eb;
  cursor: pointer;
  &:hover {
    color: #1d4ed8;
    text-decoration: underline;
  }
`;

const LoginPopup = ({ onClose, setIsRegisterOpen, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(username, password, rememberMe);
      if (response.access_token) {
        onLoginSuccess();
        onClose();
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      setError('نام کاربری یا رمز عبور اشتباه است یا مشکلی در سرور رخ داده');
      console.error('Login error:', err.response?.data || err.message);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      await requestPasswordReset(email);
      setSuccess('لینک بازنشانی رمز عبور به ایمیل شما ارسال شد');
      setError('');
      setEmail(''); // Clear email field after success
      setTimeout(() => {
        setIsResetMode(false); // Switch back to login mode after a delay
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'خطا در درخواست بازنشانی رمز عبور');
      setSuccess('');
      console.error('Password reset error:', err.response?.data || err.message);
    }
  };

  const toggleResetMode = () => {
    setIsResetMode(!isResetMode);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setEmail('');
  };

  return (
    <div css={popupStyles} onClick={onClose}>
      <div css={popupContentStyles} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">{isResetMode ? 'بازنشانی رمز عبور' : 'ورود'}</h3>
        
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}

        {!isResetMode ? (
          <form onSubmit={handleLogin}>
            <input
              css={inputStyles}
              type="text"
              placeholder="نام کاربری"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              css={inputStyles}
              type="password"
              placeholder="رمز عبور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">مرا به خاطر بسپار</label>
            </div>
            <button css={buttonStyles} type="submit">
              ورود
            </button>
            <p className="text-center">
              <span css={linkStyles} onClick={toggleResetMode}>
                رمز عبور را فراموش کرده‌اید؟
              </span>
            </p>
            <p className="mt-2 text-center">
              حساب کاربری ندارید؟{' '}
              <span
                css={linkStyles}
                onClick={() => {
                  onClose();
                  setIsRegisterOpen(true);
                }}
              >
                ثبت‌نام
              </span>
            </p>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset}>
            <input
              css={inputStyles}
              type="email"
              placeholder="ایمیل"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button css={buttonStyles} type="submit">
              ارسال لینک بازنشانی
            </button>
            <p className="text-center">
              <span css={linkStyles} onClick={toggleResetMode}>
                بازگشت به ورود
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPopup;