/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getCategoryById, getProducts, addToCart } from '../api/api';
import { containerStyles } from './style';

const CategoryProducts = () => {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, prodData] = await Promise.all([getCategoryById(categoryId), getProducts()]);
        setCategory(catData);

        // If the category has no parent ID, fetch its subcategories and their products
        if (!catData.parent_id) {
          const subcats = catData.subcategories || [];
          setSubcategories(subcats);

          // Fetch products for each subcategory
          const subcatProducts = subcats.flatMap((sub) =>
            prodData.filter((p) => p.category_id === sub.id),
          );
          const categoryProducts = prodData.filter((p) => p.category_id === parseInt(categoryId));

          setProducts([...subcatProducts, ...categoryProducts]);
        } else {
          // If the category has a parent ID, show only its own products
          setProducts(prodData.filter((p) => p.category_id === parseInt(categoryId)));
        }
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری');
      }
    };
    fetchData();
  }, [categoryId]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, product.minimum_order || 1);
      setError('محصول به سبد خرید اضافه شد!');
      setTimeout(() => setError(null), 3000); // Temporary message
    } catch (err) {
      setError(err.message || 'خطا در افزودن به سبد خرید');
      setTimeout(() => setError(null), 3000);
    }
  };

  const calculateDiscountedPrice = (price, discount) =>
    discount?.percent ? Math.round(price * (1 - discount.percent / 100)) : price;

  if (error && !error.includes('اضافه شد')) return <div className="text-center text-red-500 mt-20">{error}</div>;
  if (!category) return <div className="text-center mt-20">در حال بارگذاری...</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">{category.name}</h1>

      {/* Show subcategories if the category has no parent ID */}
      {!category.parent_id && subcategories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">زیرمجموعه‌ها</h2>
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                to={`/categories/${sub.id}`}
                className="bg-indigo-100 text-indigo-700 p-2 rounded hover:bg-indigo-200 transition"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Show products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const discountedPrice = calculateDiscountedPrice(product.price, product.discount);
          return (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
              <Link to={`/products/${product.id}`}>
                <img
                  src={product.image || 'https://via.placeholder.com/250x200'}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded"
                />
                <h2 className="text-lg font-semibold mt-2 text-gray-800">{product.name}</h2>
                <div className="mt-2 flex items-center">
                  {product.discount?.percent ? (
                    <>
                      <span className="line-through text-gray-500 text-sm">{product.price.toLocaleString()} تومان</span>
                      <span className="text-green-600 ml-2 font-medium">{discountedPrice.toLocaleString()} تومان</span>
                      <span className="text-xs text-red-500 ml-2">{product.discount.percent}% تخفیف</span>
                    </>
                  ) : (
                    <span className="text-gray-800 font-medium">{product.price.toLocaleString()} تومان</span>
                  )}
                </div>
              </Link>
              <button
                onClick={() => handleAddToCart(product)}
                className="mt-4 w-full bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600 transition"
              >
                افزودن به سبد خرید
              </button>
            </div>
          );
        })}
      </div>

      {/* Success message for adding to cart */}
      {error && error.includes('اضافه شد') && <div className="text-center text-green-500 mt-4">{error}</div>}
    </div>
  );
};

export default CategoryProducts;