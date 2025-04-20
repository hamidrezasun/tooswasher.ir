/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { Tree, TreeNode } from 'react-organizational-chart';

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

const chartModalStyles = css`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 1000px;
  direction: ltr;
  box-sizing: border-box;
  max-height: 80vh;
  overflow-y: auto;
`;

const nodeStyles = css`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
  font-size: 0.9rem;
  direction: rtl;
`;

const WorkflowChart = ({ steps, error, onClose }) => {
  const renderStepNode = (step) => {
    const successStep = steps.find((s) => s.id === step.next_step_on_success);
    const failureStep = steps.find((s) => s.id === step.next_step_on_failure);

    return (
      <TreeNode
        label={
          <div css={nodeStyles}>
            <div className="font-bold">مرحله {step.step_number}</div>
            <div>{step.description}</div>
            <div className="text-sm text-gray-600">
              {step.is_mandatory ? 'اجباری' : 'اختیاری'}
            </div>
          </div>
        }
      >
        {successStep && (
          <TreeNode
            label={
              <div css={nodeStyles} className="border-l-2 border-green-500 pl-2">
                <div className="text-green-600 text-xs">موفقیت</div>
                {renderStepNode(successStep)}
              </div>
            }
          />
        )}
        {failureStep && (
          <TreeNode
            label={
              <div css={nodeStyles} className="border-l-2 border-red-500 pl-2">
                <div className="text-red-600 text-xs">شکست</div>
                {renderStepNode(failureStep)}
              </div>
            }
          />
        )}
      </TreeNode>
    );
  };

  return (
    <div css={popupStyles} onClick={onClose}>
      <div css={chartModalStyles} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">نمودار مراحل الگو</h3>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {steps.length > 0 ? (
          <Tree
            lineWidth={'2px'}
            lineColor={'#e5e7eb'}
            lineBorderRadius={'10px'}
            label={
              <div css={nodeStyles}>
                <div className="font-bold">شروع</div>
              </div>
            }
          >
            {steps
              .filter((step) => !steps.some((s) => s.next_step_on_success === step.id || s.next_step_on_failure === step.id))
              .map((rootStep) => renderStepNode(rootStep))}
          </Tree>
        ) : (
          <p className="text-gray-600">هیچ مرحله‌ای برای این الگو تعریف نشده است.</p>
        )}
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

export default WorkflowChart;