/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getProducts } from '../api/api';
import { containerStyles } from './style';

const paginationStyles = css`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
  padding: 1rem 0;

  button {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
    background-color: white;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background-color: #f3f4f6;
    }

    &:disabled {
      background-color: #3b82f6;
      color: white;
      cursor: default;
    }
  }
`;

const productImageStyles = css`
  max-width: 100%;
  max-height: 150px;
  width: auto;
  height: auto;
  object-fit: contain;    // Keeps the full image visible without cropping
  border-radius: 8px;
  margin-bottom: 1rem;
  display: block;
  margin-left: auto;      // Center the image horizontally
  margin-right: auto;
`;

const calculateFinalPrice = (price, discount) => {
  if (!discount?.percent) return price;
  
  const discountAmount = price * (discount.percent / 100);
  if (discount.max_discount && discountAmount > discount.max_discount) {
    return Math.round(price - discount.max_discount);
  }
  return Math.round(price * (1 - discount.percent / 100));
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const allProducts = await getProducts();
        const totalItems = allProducts.length;
        setTotalPages(Math.ceil(totalItems / itemsPerPage));
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedProducts = allProducts.slice(startIndex, startIndex + itemsPerPage);
        setProducts(paginatedProducts);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری محصولات');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;
  if (isLoading) return <div className="text-center mt-20">در حال بارگذاری...</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">محصولات</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const finalPrice = calculateFinalPrice(product.price, product.discount);
            const hasDiscount = product.discount?.percent;
            const discountAmount = hasDiscount ? product.price * (product.discount.percent / 100) : 0;
            const isMaxDiscountApplied = hasDiscount && product.discount.max_discount && discountAmount > product.discount.max_discount;

            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition hover:translate-y-[-2px]"
              >
                <img
                  src={product.image || 'https://via.placeholder.com/300'}
                  alt={product.name}
                  css={productImageStyles} // Updated styling
                  loading="lazy"
                />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{product.name}</h2>
                {hasDiscount ? (
                  <div className="mb-2">
                    <span className="text-green-600">
                      تخفیف: {product.discount.percent}%
                      {isMaxDiscountApplied && (
                        <span className="text-xs text-gray-500 mr-1"> (حداکثر {product.discount.max_discount.toLocaleString()} تومان)</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-500 line-through">
                        {product.price.toLocaleString()} تومان
                      </span>
                      <span className="text-indigo-600 font-bold">
                        {finalPrice.toLocaleString()} تومان
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-indigo-600 font-bold">
                    {product.price.toLocaleString()} تومان
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div css={paginationStyles}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              قبلی
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                disabled={page === currentPage}
                className={page === currentPage ? 'active' : ''}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              بعدی
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;