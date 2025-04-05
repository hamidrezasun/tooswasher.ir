/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api/api';
import { popupStyles, popupContentStyles } from './NavbarStyles';

const CategoryPopup = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCategories()
      .then((data) => {
        console.log('Categories from API:', data);
        setCategories(data);
      })
      .catch((err) => setError(err.message || 'خطا در بارگذاری دسته‌بندی‌ها'));
  }, []);

  const topLevelCategories = categories.filter((cat) => !cat.parent_id);

  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div css={popupStyles}>
      <div css={popupContentStyles}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">دسته‌بندی‌ها</h2>
        <div className="space-y-4">
          {topLevelCategories.map((category) => (
            <div key={category.id}>
              <Link
                to={`/categories/${category.id}`}
                onClick={onClose}
                className="block text-indigo-700 font-semibold hover:underline"
              >
                {category.name}
              </Link>
              {category.subcategories && category.subcategories.length > 0 && (
                <ul className="mr-4 mt-2 space-y-1">
                  {category.subcategories.map((subcat) => (
                    <li key={subcat.id}>
                      <Link
                        to={`/categories/${subcat.id}`}
                        onClick={onClose}
                        className="text-gray-600 hover:text-indigo-500 transition"
                      >
                        {subcat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition"
        >
          بستن
        </button>
      </div>
    </div>
  );
};

export default CategoryPopup;