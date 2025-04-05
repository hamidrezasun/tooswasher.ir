/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../api/api';

const popupStyles = css`
  @apply fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30;
`;

const contentStyles = css`
  @apply bg-white p-6 rounded-lg shadow-lg w-full max-w-md;
`;

const SearchPopup = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query) {
      getProducts()
        .then((products) => setResults(products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))))
        .catch((err) => setError(err.message || 'خطا در جستجو'));
    } else {
      setResults([]);
    }
  }, [query]);

  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div css={popupStyles}>
      <div css={contentStyles}>
        <h2 className="text-xl font-bold mb-4 text-gray-800">جستجو</h2>
        <input
          type="text"
          placeholder="جستجو در محصولات..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full p-2 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              onClick={onClose}
              className="block p-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
            >
              {product.name}
            </Link>
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

export default SearchPopup;