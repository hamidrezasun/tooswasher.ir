/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React, { useState, useEffect } from 'react';
import { getCategories } from '../api/api';

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
  z-index: 100;
`;

const popupContentStyles = css`
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 500px;
  direction: rtl;
`;

const ProductPopup = ({ product, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState(
    product || {
      name: '',
      price: '',
      description: '',
      image: '',
      category_id: '',
      stock: '',
      rate: '',
      minimum_order: '',
    }
  );
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
        if (product?.category_id) {
          setFormData((prev) => ({ ...prev, category_id: product.category_id.toString() }));
        }
        if (product?.stock) {
          setFormData((prev) => ({ ...prev, stock: product.stock.toString() }));
        }
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری دسته‌بندی‌ها');
      }
    };
    fetchCategories();
  }, [product]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name) {
      setError('نام محصول الزامی است');
      return;
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      setError('قیمت باید یک عدد معتبر باشد');
      return;
    }
    if (!formData.stock || isNaN(parseInt(formData.stock))) {
      setError('موجودی (stock) باید یک عدد معتبر باشد');
      return;
    }
    if (!formData.category_id) {
      setError('لطفاً یک دسته‌بندی انتخاب کنید');
      return;
    }

    const preparedData = {
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category_id: parseInt(formData.category_id),
      description: formData.description || null,
      image: formData.image || null,
      rate: formData.rate ? parseFloat(formData.rate) : null,
      minimum_order: formData.minimum_order ? parseInt(formData.minimum_order) : 1,
    };

    onSave(preparedData);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div css={popupStyles} onClick={onClose}>
      <div css={popupContentStyles} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">
          {product ? 'ویرایش محصول' : 'افزودن محصول'}
        </h3>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="نام محصول"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="قیمت"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <input
            type="number"
            placeholder="موجودی (stock)"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <input
            type="text"
            placeholder="توضیحات"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="text"
            placeholder="لینک تصویر"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="number"
            step="0.1"
            placeholder="ضریب تعداد(rate)"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="number"
            placeholder="حداقل سفارش"
            value={formData.minimum_order}
            onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="text"
            placeholder="جستجوی دسته‌بندی..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
          />
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
            required
          >
            <option value="">انتخاب دسته‌بندی</option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              ذخیره
            </button>
            {product && onDelete && (
              <button
                onClick={() => onDelete(product.id)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                حذف
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              لغو
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductPopup;