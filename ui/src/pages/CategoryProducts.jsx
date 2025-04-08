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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catData, prodData] = await Promise.all([
          getCategoryById(categoryId),
          getProducts()
        ]);
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
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryId]);

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id, product.minimum_order || 1);
      setError('محصول به سبد خرید اضافه شد!');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError(err.message || 'خطا در افزودن به سبد خرید');
      setTimeout(() => setError(null), 3000);
    }
  };

  const calculateFinalPrice = (product) => {
    if (!product.discount?.percent) return product.price;

    const discountAmount = product.price * (product.discount.percent / 100);
    if (product.discount.max_discount && discountAmount > product.discount.max_discount) {
      return Math.round(product.price - product.discount.max_discount);
    }
    return Math.round(product.price * (1 - product.discount.percent / 100));
  };

  if (loading) return (
    <div css={containerStyles}>
      <Navbar />
      <div className="text-center mt-20">در حال بارگذاری...</div>
    </div>
  );

  if (error && !error.includes('اضافه شد')) return (
    <div css={containerStyles}>
      <Navbar />
      <div className="text-center text-red-500 mt-20">{error}</div>
    </div>
  );

  return (
    <div css={containerStyles}>
      <Navbar />
      
      {/* Category Header with Image */}
      <div className="mb-8 text-center">
        {category.image_url && (
          <div className="flex justify-center mb-4">
            <img 
              src={category.image_url} 
              alt={category.name}
              className="max-h-40 object-contain rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        <h1 className="text-3xl font-bold text-gray-800">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            {category.description}
          </p>
        )}
      </div>

      {/* Show subcategories if the category has no parent ID */}
      {!category.parent_id && subcategories.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">زیرمجموعه‌ها</h2>
          <div className="flex flex-wrap gap-2">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                to={`/categories/${sub.id}`}
                className="bg-indigo-100 text-indigo-700 p-2 rounded hover:bg-indigo-200 transition flex items-center"
              >
                {sub.image_url && (
                  <img 
                    src={sub.image_url}
                    alt={sub.name}
                    className="w-8 h-8 object-cover rounded-full mr-2"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                )}
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Show products */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const finalPrice = calculateFinalPrice(product);
          const hasDiscount = product.discount?.percent;
          const discountAmount = hasDiscount ? product.price * (product.discount.percent / 100) : 0;
          const isMaxDiscountApplied = hasDiscount && product.discount.max_discount && discountAmount > product.discount.max_discount;

          return (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
              <Link to={`/products/${product.id}`}>
                <img
                  src={product.image || 'https://via.placeholder.com/250x200'}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/250x200';
                  }}
                />
                <h2 className="text-lg font-semibold mt-2 text-gray-800">{product.name}</h2>
                <div className="mt-2 flex items-center">
                  {hasDiscount ? (
                    <>
                      <span className="line-through text-gray-500 text-sm">{product.price.toLocaleString()} تومان</span>
                      <span className="text-green-600 ml-2 font-medium">{finalPrice.toLocaleString()} تومان</span>
                      <span className="text-xs text-red-500 ml-2">
                        {product.discount.percent}% تخفیف
                        {isMaxDiscountApplied && (
                          <span className="text-xs text-gray-500 mr-1"> (حداکثر {product.discount.max_discount.toLocaleString()} تومان)</span>
                        )}
                      </span>
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
      {error && error.includes('اضافه شد') && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default CategoryProducts;