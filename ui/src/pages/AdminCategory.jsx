/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  getUserProfile 
} from '../api/api';
import { isAuthenticated } from '../api/auth';
import { containerStyles } from './style';

const searchBarStyles = css`
  width: 100%;
  max-width: 400px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
`;

const categoryCardStyles = css`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const buttonStyles = css`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-left: 0.5rem;

  &:hover {
    opacity: 0.9;
  }
`;

const editButtonStyles = css`
  ${buttonStyles}
  background-color: #3b82f6;
  color: white;
`;

const deleteButtonStyles = css`
  ${buttonStyles}
  background-color: #ef4444;
  color: white;
`;

const addButtonStyles = css`
  ${buttonStyles}
  background-color: #10b981;
  color: white;
`;

const formStyles = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const inputStyles = css`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
`;

const textareaStyles = css`
  ${inputStyles}
  min-height: 100px;
`;

const imagePreviewStyles = css`
  max-width: 200px;
  max-height: 200px;
  border-radius: 0.375rem;
  margin-top: 0.5rem;
`;

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null,
    image_url: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated()) {
          const user = await getUserProfile();
          setIsAdmin(user.role === 'admin');
        }
        const data = await getCategories();
        setCategories(data || []);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری دسته‌بندی‌ها');
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      // Prepare data for API call
      const categoryData = {
        ...formData,
        parent_id: formData.parent_id || null,
        image_url: formData.image_url || null
      };

      if (selectedCategory) {
        const updated = await updateCategory(selectedCategory.id, categoryData);
        setCategories(categories.map(c => c.id === updated.id ? updated : c));
      } else {
        const newCategory = await createCategory(categoryData);
        setCategories([...categories, newCategory]);
      }
      resetForm();
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.detail;
        const errorMessage = validationErrors
          .map((e) => `خطا در ${e.loc.join(' -> ')}: ${e.msg}`)
          .join(', ');
        setError(errorMessage || 'خطا در ذخیره دسته‌بندی: داده‌ها نامعتبر است');
      } else {
        setError(err.message || 'خطا در ذخیره دسته‌بندی');
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این دسته‌بندی را حذف کنید؟')) {
      try {
        await deleteCategory(id);
        setCategories(categories.filter(c => c.id !== id));
        if (selectedCategory && selectedCategory.id === id) {
          resetForm();
        }
      } catch (err) {
        setError(err.message || 'خطا در حذف دسته‌بندی');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_id: null,
      image_url: ''
    });
    setSelectedCategory(null);
    setShowAddForm(false);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      parent_id: category.parent_id,
      image_url: category.image_url || ''
    });
    setShowAddForm(true);
  };

  if (isAdmin === false) return <Navigate to="/" />;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">مدیریت دسته‌بندی‌ها</h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            css={addButtonStyles}
          >
            افزودن دسته‌بندی جدید
          </button>
        </div>

        {showAddForm && (
          <div css={categoryCardStyles}>
            <h2 className="text-xl font-semibold">
              {selectedCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
            </h2>
            <form onSubmit={handleSaveCategory} css={formStyles}>
              <div>
                <label className="block mb-1">نام دسته‌بندی:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  css={inputStyles}
                />
              </div>
              <div>
                <label className="block mb-1">توضیحات:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  css={textareaStyles}
                />
              </div>
              <div>
                <label className="block mb-1">آدرس تصویر (URL):</label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  css={inputStyles}
                />
                {formData.image_url && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">پیش‌نمایش تصویر:</p>
                    <img 
                      src={formData.image_url} 
                      alt="پیش‌نمایش تصویر دسته‌بندی" 
                      css={imagePreviewStyles}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block mb-1">دسته‌بندی والد (اختیاری):</label>
                <select
                  name="parent_id"
                  value={formData.parent_id || ''}
                  onChange={handleInputChange}
                  css={inputStyles}
                >
                  <option value="">بدون والد</option>
                  {categories
                    .filter(c => !c.parent_id) // Only show top-level categories as parents
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  css={editButtonStyles}
                >
                  {selectedCategory ? 'ذخیره تغییرات' : 'افزودن'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">لیست دسته‌بندی‌ها</h2>
          {categories.length === 0 ? (
            <p className="text-gray-500">هیچ دسته‌بندی یافت نشد</p>
          ) : (
            <div className="space-y-4">
              {categories.map(category => (
                <div key={category.id} css={categoryCardStyles}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-medium">{category.name}</h3>
                      {category.description && (
                        <p className="text-gray-600 mt-1">{category.description}</p>
                      )}
                      {category.image_url && (
                        <div className="mt-2">
                          <img 
                            src={category.image_url} 
                            alt={`تصویر ${category.name}`}
                            css={imagePreviewStyles}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {category.parent_id && (
                        <p className="text-sm text-gray-500 mt-1">
                          والد: {categories.find(c => c.id === category.parent_id)?.name || 'نامشخص'}
                        </p>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => handleEditCategory(category)}
                        css={editButtonStyles}
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        css={deleteButtonStyles}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                      <h4 className="font-medium text-gray-700">زیردسته‌ها:</h4>
                      <div className="space-y-2 mt-2">
                        {category.subcategories.map(sub => (
                          <div key={sub.id} className="bg-gray-50 p-2 rounded">
                            <div className="flex justify-between">
                              <span>{sub.name}</span>
                              <div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditCategory(sub);
                                  }}
                                  css={editButtonStyles}
                                  className="text-sm py-1 px-2"
                                >
                                  ویرایش
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCategory(sub.id);
                                  }}
                                  css={deleteButtonStyles}
                                  className="text-sm py-1 px-2"
                                >
                                  حذف
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;