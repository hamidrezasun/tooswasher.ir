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

const AssignNextStepsModal = ({ step, templateSteps, error, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    next_step_on_success: step.next_step_on_success?.toString() || '',
    next_step_on_failure: step.next_step_on_failure?.toString() || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div css={popupStyles} onClick={onClose}>
      <div css={modalStyles} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">تعیین مراحل بعدی</h3>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">
            مرحله بعدی در موفقیت (اختیاری):
            <select
              value={formData.next_step_on_success}
              onChange={(e) => setFormData({ ...formData, next_step_on_success: e.target.value })}
              className="w-full p-2 mb-2 border rounded"
            >
              <option value="">انتخاب کنید</option>
              {templateSteps
                .filter((s) => s.id !== step.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}: {s.description}
                  </option>
                ))}
            </select>
          </label>
          <label className="block mb-2">
            مرحله بعدی در شکست (اختیاری):
            <select
              value={formData.next_step_on_failure}
              onChange={(e) => setFormData({ ...formData, next_step_on_failure: e.target.value })}
              className="w-full p-2 mb-2 border rounded"
            >
              <option value="">انتخاب کنید</option>
              {templateSteps
                .filter((s) => s.id !== step.id)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}: {s.description}
                  </option>
                ))}
            </select>
          </label>
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

export default AssignNextStepsModal;