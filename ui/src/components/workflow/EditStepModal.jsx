/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState } from 'react';

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

const modalStyles = css`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 600px;
  direction: rtl;
  box-sizing: border-box;
`;

const EditStepModal = ({ step, error, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    step_number: step.step_number.toString(),
    description: step.description,
    is_mandatory: step.is_mandatory,
    default_expected_duration: step.default_expected_duration?.toString() || '',
    default_required_documents: step.default_required_documents || '',
    default_output: step.default_output || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div css={popupStyles} onClick={onClose}>
      <div css={modalStyles} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">ویرایش مرحله الگو</h3>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="number"
            placeholder="شماره مرحله"
            value={formData.step_number}
            onChange={(e) => setFormData({ ...formData, step_number: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
            required
          />
          <textarea
            placeholder="توضیحات"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
            required
          />
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={formData.is_mandatory}
              onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
              className="mr-2"
            />
            اجباری
          </label>
          <input
            type="number"
            placeholder="مدت زمان پیش‌فرض (اختیاری)"
            value={formData.default_expected_duration}
            onChange={(e) => setFormData({ ...formData, default_expected_duration: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
          />
          <input
            type="text"
            placeholder="مستندات مورد نیاز (اختیاری)"
            value={formData.default_required_documents}
            onChange={(e) => setFormData({ ...formData, default_required_documents: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
          />
          <input
            type="text"
            placeholder="خروجی پیش‌فرض (اختیاری)"
            value={formData.default_output}
            onChange={(e) => setFormData({ ...formData, default_output: e.target.value })}
            className="w-full p-2 mb-2 border rounded"
          />
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              ذخیره
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              لغو
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStepModal;