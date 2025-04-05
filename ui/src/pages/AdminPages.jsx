/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  getPages, 
  createPage, 
  updatePage, 
  deletePage,
  getUserProfile,
  searchPages
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

const pageCardStyles = css`
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
  min-height: 200px;
`;

const checkboxStyles = css`
  margin-left: 0.5rem;
`;

const AdminPages = () => {
  const [pages, setPages] = useState([]);
  const [filteredPages, setFilteredPages] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    body: '',
    is_in_menu: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated()) {
          const user = await getUserProfile();
          setIsAdmin(user.role === 'admin');
        }
        const data = await getPages();
        setPages(data || []);
        setFilteredPages(data || []);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری صفحات');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const search = async () => {
      if (searchTerm.trim() === '') {
        setFilteredPages(pages);
        return;
      }
      try {
        const data = await searchPages(searchTerm);
        setFilteredPages(data || []);
      } catch (err) {
        setError(err.message || 'خطا در جستجو');
      }
    };
    search();
  }, [searchTerm, pages]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSavePage = async (e) => {
    e.preventDefault();
    try {
      if (selectedPage) {
        const updated = await updatePage(selectedPage.id, formData);
        setPages(pages.map(p => p.id === updated.id ? updated : p));
        setFilteredPages(filteredPages.map(p => p.id === updated.id ? updated : p));
      } else {
        const newPage = await createPage(formData);
        setPages([...pages, newPage]);
        setFilteredPages([...filteredPages, newPage]);
      }
      resetForm();
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.detail;
        const errorMessage = validationErrors
          .map((e) => `خطا در ${e.loc.join(' -> ')}: ${e.msg}`)
          .join(', ');
        setError(errorMessage || 'خطا در ذخیره صفحه: داده‌ها نامعتبر است');
      } else {
        setError(err.message || 'خطا در ذخیره صفحه');
      }
    }
  };

  const handleDeletePage = async (id) => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این صفحه را حذف کنید؟')) {
      try {
        await deletePage(id);
        setPages(pages.filter(p => p.id !== id));
        setFilteredPages(filteredPages.filter(p => p.id !== id));
        if (selectedPage && selectedPage.id === id) {
          resetForm();
        }
      } catch (err) {
        setError(err.message || 'خطا در حذف صفحه');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      body: '',
      is_in_menu: false
    });
    setSelectedPage(null);
    setShowAddForm(false);
  };

  const handleEditPage = (page) => {
    setSelectedPage(page);
    setFormData({
      name: page.name,
      body: page.body || '',
      is_in_menu: page.is_in_menu || false
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
          <h1 className="text-3xl font-bold text-gray-800">مدیریت صفحات</h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            css={addButtonStyles}
          >
            افزودن صفحه جدید
          </button>
        </div>

        <input
          type="text"
          placeholder="جستجوی صفحات..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          css={searchBarStyles}
        />

        {showAddForm && (
          <div css={pageCardStyles}>
            <h2 className="text-xl font-semibold">
              {selectedPage ? 'ویرایش صفحه' : 'افزودن صفحه جدید'}
            </h2>
            <form onSubmit={handleSavePage} css={formStyles}>
              <div>
                <label className="block mb-1">عنوان صفحه:</label>
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
                <label className="block mb-1">محتوای صفحه:</label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  css={textareaStyles}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_in_menu"
                  checked={formData.is_in_menu}
                  onChange={handleInputChange}
                  css={checkboxStyles}
                />
                <label>نمایش در منو</label>
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
                  {selectedPage ? 'ذخیره تغییرات' : 'افزودن'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">لیست صفحات</h2>
          {filteredPages.length === 0 ? (
            <p className="text-gray-500">هیچ صفحه‌ای یافت نشد</p>
          ) : (
            <div className="space-y-4">
              {filteredPages.map(page => (
                <div key={page.id} css={pageCardStyles}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-medium">{page.name}</h3>
                      {page.is_in_menu && (
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                          نمایش در منو
                        </span>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => handleEditPage(page)}
                        css={editButtonStyles}
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        css={deleteButtonStyles}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                  {page.body && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <p className="text-gray-700 line-clamp-3">
                        {page.body.substring(0, 200)}...
                      </p>
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

export default AdminPages;