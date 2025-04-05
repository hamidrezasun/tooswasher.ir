/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState } from 'react';
import { loginForAccessToken,setAuthToken  } from '../api/api';
import { saveToken } from '../api/auth';

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

const LoginPopup = ({ onClose, setIsRegisterOpen, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('grant_type', 'password'); // Ensure this matches your server
      const data = await loginForAccessToken(formData);
      saveToken(data.access_token);
      setAuthToken(data.access_token);
      console.log('Login response:', data); // Debug the response
      if (data.access_token) {
        onLoginSuccess(); // Trigger navbar update
        onClose();
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      setError('نام کاربری یا رمز عبور اشتباه است یا مشکلی در سرور رخ داده');
      console.error('Login error:', err.response?.data || err.message);
    }
  };

  return (
    <div css={popupStyles} onClick={onClose}>
      <div css={popupContentStyles} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">ورود</h3>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="نام کاربری"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="password"
            placeholder="رمز عبور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            ورود
          </button>
        </form>
        <p className="mt-4 text-center">
          حساب کاربری ندارید؟{' '}
          <span
            className="text-blue-500 cursor-pointer underline"
            onClick={() => {
              onClose();
              setIsRegisterOpen(true);
            }}
          >
            ثبت‌نام
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPopup;