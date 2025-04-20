/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

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

const stepDetailsModalStyles = css`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 600px;
  direction: rtl;
  box-sizing: border-box;
`;

const StepDetailsModal = ({ step, templateSteps, error, onClose }) => {
  const getStepDisplay = (stepId) => {
    const foundStep = templateSteps.find((s) => s.id === stepId);
    return foundStep ? `${foundStep.id}: ${foundStep.description}` : '-';
  };

  return (
    <div css={popupStyles} onClick={onClose}>
      <div css={stepDetailsModalStyles} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">جزئیات مرحله الگو</h3>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="mb-2">
          <strong>شماره مرحله:</strong> {step.step_number}
        </div>
        <div className="mb-2">
          <strong>توضیحات:</strong> {step.description}
        </div>
        <div className="mb-2">
          <strong>اجباری:</strong> {step.is_mandatory ? 'بله' : 'خیر'}
        </div>
        <div className="mb-2">
          <strong>مدت زمان پیش‌فرض:</strong> {step.default_expected_duration || '-'}
        </div>
        <div className="mb-2">
          <strong>مستندات مورد نیاز:</strong> {step.default_required_documents || '-'}
        </div>
        <div className="mb-2">
          <strong>خروجی پیش‌فرض:</strong> {step.default_output || '-'}
        </div>
        <div className="mb-2">
          <strong>مرحله بعدی در موفقیت:</strong> {getStepDisplay(step.next_step_on_success)}
        </div>
        <div className="mb-2">
          <strong>مرحله بعدی در شکست:</strong> {getStepDisplay(step.next_step_on_failure)}
        </div>
        <button
          onClick={onClose}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mt-4"
        >
          بستن
        </button>
      </div>
    </div>
  );
};

export default StepDetailsModal;