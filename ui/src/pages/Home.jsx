/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import CategoryPopup from '../components/CategoryPopup';
import {containerStyles} from './style';

const headerStyles = css`
  background-color: #2563eb;
  color: white;
  padding: 4rem 1rem;
  text-align: center;
  margin-top: 0;
`;

const contentStyles = css`
  max-width: 48rem; /* 6xl */
  margin-left: auto;
  margin-right: auto;
  padding: 100rem 1rem;
`;

const Home = () => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  return (
    <div css={containerStyles}>
      <Navbar />
      <header css={headerStyles}>
        <h1 className="text-4xl font-bold mb-4">به طوس واشر خوش آمدید</h1>
        <p className="text-lg">تولیدکننده انواع واشرهای صنعتی با کیفیت بالا</p>
        <button
          onClick={() => setIsCategoryOpen(true)}
          className="mt-6 bg-white text-blue-600 px-6 py-2 rounded-full font-semibold hover:bg-blue-100 transition"
        >
          مشاهده دسته‌بندی‌ها
        </button>
      </header>
      <div css={contentStyles}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">درباره ما</h2>
        <p className="text-gray-600">
          طوس واشر با سال‌ها تجربه در تولید واشرهای صنعتی، آماده ارائه محصولات با کیفیت به مشتریان عزیز است.
        </p>
        {/* Temporary content for scrolling */}
        {Array(20).fill().map((_, index) => (
          <p key={index} className="text-gray-600 mt-4">
            این یک متن آزمایشی برای تست اسکرول است.
          </p>
        ))}
      </div>
      {isCategoryOpen && <CategoryPopup onClose={() => setIsCategoryOpen(false)} />}
    </div>
  );
};

export default Home;