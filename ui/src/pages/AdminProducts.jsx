/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProductPopup from '../components/ProductPopup';
import { getProducts, searchProducts, createProduct, updateProduct, deleteProduct, getUserProfile } from '../api/api';
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

const productSectionStyles = css`
  margin-bottom: 2rem;
`;

const productTitleStyles = css`
  font-size: 1.5rem;
  font-weight: bold;
  color: #374151;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
`;

const paginationStyles = css`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const buttonStyles = css`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background-color: #3b82f6;
  color: white;
  &:hover {
    background-color: #2563eb;
  }
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10); // Default items per page
  const [totalProducts, setTotalProducts] = useState(0); // To track total number of products

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated()) {
          const user = await getUserProfile();
          setIsAdmin(user.role === 'admin');
        }
        const data = await getProducts(skip, limit);
        setProducts(data || []);
        setFilteredProducts(data || []);
        // Assuming the API doesn't return total count; estimate based on returned data
        setTotalProducts(data.length === limit ? skip + limit + 1 : skip + data.length);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری');
      }
    };
    fetchData();
  }, [skip, limit]);

  useEffect(() => {
    const search = async () => {
      if (searchTerm.trim() === '') {
        const data = await getProducts(skip, limit); // Fetch paginated data when search is cleared
        setFilteredProducts(data || []);
        setTotalProducts(data.length === limit ? skip + limit + 1 : skip + data.length);
        return;
      }
      try {
        const data = await searchProducts(searchTerm, skip, limit); // Paginated search
        setFilteredProducts(data || []);
        setTotalProducts(data.length === limit ? skip + limit + 1 : skip + data.length);
      } catch (err) {
        setError(err.message || 'خطا در جستجو');
      }
    };
    search();
  }, [searchTerm, skip, limit]); // Added skip and limit as dependencies

  const handleSaveProduct = async (data) => {
    try {
      if (selectedProduct) {
        const updated = await updateProduct(selectedProduct.id, data);
        setProducts(products.map((p) => (p.id === updated.id ? updated : p)));
        setFilteredProducts(filteredProducts.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const newProduct = await createProduct(data);
        setProducts([...products, newProduct]);
        setFilteredProducts([...filteredProducts, newProduct]);
        setTotalProducts(totalProducts + 1);
      }
      setSelectedProduct(null);
      setShowAddPopup(false);
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.detail;
        const errorMessage = validationErrors
          .map((e) => `خطا در ${e.loc.join(' -> ')}: ${e.msg}`)
          .join(', ');
        setError(errorMessage || 'خطا در ذخیره محصول: داده‌ها نامعتبر است');
      } else {
        setError(err.message || 'خطا در ذخیره محصول');
      }
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('آیا مطمئن هستید؟')) {
      try {
        await deleteProduct(id);
        setProducts(products.filter((p) => p.id !== id));
        setFilteredProducts(filteredProducts.filter((p) => p.id !== id));
        setTotalProducts(totalProducts - 1);
        setSelectedProduct(null);
      } catch (err) {
        setError(err.message || 'خطا در حذف محصول');
      }
    }
  };

  const handlePageChange = (direction) => {
    if (direction === 'next' && skip + limit < totalProducts) {
      setSkip(skip + limit);
    } else if (direction === 'prev' && skip > 0) {
      setSkip(skip - limit);
    }
  };

  if (isAdmin === false) return <Navigate to="/products" />;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">مدیریت محصولات</h1>
          <button
            onClick={() => setShowAddPopup(true)}
            className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
          >
            افزودن محصول
          </button>
        </div>
        <input
          type="text"
          placeholder="جستجوی محصول..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          css={searchBarStyles}
        />
        <div css={productSectionStyles}>
          <h2 css={productTitleStyles}>محصولات</h2>
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500">محصولی یافت نشد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg shadow-md">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="p-3 text-right">نام</th>
                    <th className="p-3 text-right">قیمت</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-t hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <td className="p-3">{product.name}</td>
                      <td className="p-3">{product.price.toLocaleString()} تومان</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div css={paginationStyles}>
            <button
              css={buttonStyles}
              onClick={() => handlePageChange('prev')}
              disabled={skip === 0}
            >
              قبلی
            </button>
            <span>
              صفحه {Math.floor(skip / limit) + 1} از {Math.ceil(totalProducts / limit)}
            </span>
            <button
              css={buttonStyles}
              onClick={() => handlePageChange('next')}
              disabled={skip + limit >= totalProducts}
            >
              بعدی
            </button>
          </div>
        </div>
      </div>
      {(selectedProduct || showAddPopup) && (
        <ProductPopup
          product={selectedProduct}
          onSave={handleSaveProduct}
          onDelete={selectedProduct ? handleDeleteProduct : null}
          onClose={() => {
            setSelectedProduct(null);
            setShowAddPopup(false);
          }}
        />
      )}
    </div>
  );
};

export default AdminProducts;