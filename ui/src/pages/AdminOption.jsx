/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  getOptions,
  getOptionByName,
  createOption,
  updateOption,
  deleteOption,
  getUserProfile
} from '../api/api';
import { isAuthenticated } from '../api/auth';
import { containerStyles } from './style';

const optionCardStyles = css`
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

const AdminOptions = () => {
  const [options, setOptions] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    option_name: '',
    option_value: ''
  });

  const defaultOptions = [
    { option_name: 'company_color_code', option_value: '#4F46E5' },
    { option_name: 'title', option_value: 'title' },
    { option_name: 'admin_email', option_value: 'admin_email' },
    { option_name: 'title_description', option_value: 'title_description' },
    { option_name: 'company_description', option_value: 'company_description' },
    { option_name: 'company_name', option_value: 'company_name' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated()) {
          const user = await getUserProfile();
          setIsAdmin(user.role === 'admin');
        }

        // Ensure default options exist
        for (const defaultOption of defaultOptions) {
          try {
            await getOptionByName(defaultOption.option_name);
          } catch (err) {
            if (err.response?.status === 404) {
              // Option doesn't exist, create it
              await createOption(defaultOption);
            }
          }
        }

        const data = await getOptions();
        setOptions(data || []);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری تنظیمات');
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

  const handleSaveOption = async (e) => {
    e.preventDefault();
    try {
      if (selectedOption) {
        const updated = await updateOption(selectedOption.option_id, formData);
        setOptions(options.map(o => o.option_id === updated.option_id ? updated : o));
      } else {
        const newOption = await createOption(formData);
        setOptions([...options, newOption]);
      }
      resetForm();
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.detail;
        const errorMessage = validationErrors
          .map((e) => `خطا در ${e.loc.join(' -> ')}: ${e.msg}`)
          .join(', ');
        setError(errorMessage || 'خطا در ذخیره تنظیمات: داده‌ها نامعتبر است');
      } else {
        setError(err.message || 'خطا در ذخیره تنظیمات');
      }
    }
  };

  const handleDeleteOption = async (id) => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این تنظیم را حذف کنید؟')) {
      try {
        await deleteOption(id);
        setOptions(options.filter(o => o.option_id !== id));
        if (selectedOption && selectedOption.option_id === id) {
          resetForm();
        }
      } catch (err) {
        setError(err.message || 'خطا در حذف تنظیم');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      option_name: '',
      option_value: ''
    });
    setSelectedOption(null);
    setShowAddForm(false);
  };

  const handleEditOption = (option) => {
    setSelectedOption(option);
    setFormData({
      option_name: option.option_name,
      option_value: option.option_value
    });
    setShowAddForm(true);
  };

  const isDefaultOption = (optionName) => {
    return defaultOptions.some(defaultOption => defaultOption.option_name === optionName);
  };

  if (isAdmin === false) return <Navigate to="/" />;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">مدیریت تنظیمات</h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            css={addButtonStyles}
          >
            افزودن تنظیم جدید
          </button>
        </div>

        {showAddForm && (
          <div css={optionCardStyles}>
            <h2 className="text-xl font-semibold">
              {selectedOption ? 'ویرایش تنظیم' : 'افزودن تنظیم جدید'}
            </h2>
            <form onSubmit={handleSaveOption} css={formStyles}>
              <div>
                <label className="block mb-1">نام تنظیم:</label>
                <input
                  type="text"
                  name="option_name"
                  value={formData.option_name}
                  onChange={handleInputChange}
                  required
                  disabled={!!selectedOption && isDefaultOption(selectedOption.option_name)} // Disable for default options
                  css={inputStyles}
                />
              </div>
              <div>
                <label className="block mb-1">مقدار:</label>
                <input
                  type="text"
                  name="option_value"
                  value={formData.option_value}
                  onChange={handleInputChange}
                  required
                  css={inputStyles}
                />
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
                  {selectedOption ? 'ذخیره تغییرات' : 'افزودن'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">لیست تنظیمات</h2>
          {options.length === 0 ? (
            <p className="text-gray-500">هیچ تنظیمی یافت نشد</p>
          ) : (
            <div className="space-y-4">
              {options.map(option => (
                <div key={option.option_id} css={optionCardStyles}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-medium">{option.option_name}</h3>
                      <p className="text-gray-600 mt-1">{option.option_value}</p>
                    </div>
                    <div>
                      <button
                        onClick={() => handleEditOption(option)}
                        css={editButtonStyles}
                      >
                        ویرایش
                      </button>
                      {!isDefaultOption(option.option_name) && (
                        <button
                          onClick={() => handleDeleteOption(option.option_id)}
                          css={deleteButtonStyles}
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOptions;