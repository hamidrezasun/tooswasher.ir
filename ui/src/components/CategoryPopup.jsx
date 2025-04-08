/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../api/api';

const CategoryPopup = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);

  useEffect(() => {
    getCategories()
      .then((data) => {
        console.log('Categories from API:', data);
        setCategories(data);
      })
      .catch((err) => setError(err.message || 'خطا در بارگذاری دسته‌بندی‌ها'));
  }, []);

  const topLevelCategories = categories.filter((cat) => !cat.parent_id);

  // Styles
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
    z-index: 1000;
  `;

  const popupContentStyles = css`
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    padding: 2rem;
    position: relative;
    font-family: 'Vazir', sans-serif;
    direction: rtl;
  `;

  const categoryListStyles = css`
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  `;

  const categoryItemStyles = css`
    padding: 0.75rem 1rem;
    border-radius: 8px;
    color: #4b5563;
    font-weight: 600;
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      background: #eef2ff;
      color: #4338ca;
    }
  `;

  const subcategoryListStyles = css`
    margin-right: 1.5rem;
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  `;

  const subcategoryItemStyles = css`
    padding: 0.5rem 1rem;
    color: #6b7280;
    transition: color 0.3s ease;

    &:hover {
      color: #4338ca;
    }
  `;

  const parentInSubcategoryStyles = css`
    padding: 0.5rem 1rem;
    color: #4338ca;
    font-weight: 700;
    background: #eef2ff;
    border-radius: 6px;
    transition: background 0.3s ease;

    &:hover {
      background: #dbeafe;
      color: #1e3a8a;
    }
  `;

  const closeButtonStyles = css`
    width: 100%;
    padding: 0.75rem;
    background: #6b7280;
    color: white;
    border-radius: 8px;
    font-weight: 600;
    transition: background 0.3s ease;
    border: none;
    cursor: pointer;

    &:hover {
      background: #4b5563;
    }
  `;

  const toggleIconStyles = css`
    margin-left: 0.5rem;
    font-size: 0.9rem;
    transition: transform 0.3s ease;
    display: inline-block;
  `;

  if (error) {
    return (
      <div css={popupStyles}>
        <div css={popupContentStyles}>
          <div className="text-red-500 text-center py-4">{error}</div>
          <button onClick={onClose} css={closeButtonStyles}>
            بستن
          </button>
        </div>
      </div>
    );
  }

  return (
    <div css={popupStyles}>
      <div css={popupContentStyles}>
        <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">دسته‌بندی‌ها</h2>
        <div css={categoryListStyles}>
          {topLevelCategories.map((category) => (
            <div key={category.id}>
              <div
                css={categoryItemStyles}
                onClick={() =>
                  setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  )
                }
              >
                {category.name}
                {(category.subcategories && category.subcategories.length > 0) && (
                  <span
                    css={toggleIconStyles}
                    style={{
                      transform:
                        expandedCategory === category.id
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',
                    }}
                  >
                    ▼
                  </span>
                )}
              </div>
              {expandedCategory === category.id && (
                <div css={subcategoryListStyles}>
                  {/* Add the parent category as a subcategory */}
                  <Link
                    to={`/categories/${category.id}`}
                    onClick={onClose}
                    css={parentInSubcategoryStyles}
                  >
                    {category.name}
                  </Link>
                  {category.subcategories && category.subcategories.length > 0 ? (
                    category.subcategories.map((subcat) => (
                      <Link
                        key={subcat.id}
                        to={`/categories/${subcat.id}`}
                        onClick={onClose}
                        css={subcategoryItemStyles}
                      >
                        {subcat.name}
                      </Link>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">بدون زیرمجموعه</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={onClose} css={closeButtonStyles} className="mt-6">
          بستن
        </button>
      </div>
    </div>
  );
};

export default CategoryPopup;