/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import EditStepModal from './EditStepModal';
import AssignNextStepsModal from './AssignNextStepsModal';
import { searchUsersByName } from '../../api/api';

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
  max-width: 800px;
  direction: rtl;
  box-sizing: border-box;
  max-height: 80vh;
  overflow-y: auto;
`;

const stepFormStyles = css`
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
`;

const stepTableStyles = css`
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  background: #f9fafb;
`;

const WorkflowTemplateForm = ({
  isEditing,
  formData,
  setFormData,
  stepFormData,
  setStepFormData,
  templateSteps,
  setTemplateSteps,
  file,
  setFile,
  viewerSearch,
  setViewerSearch,
  responsibleSearch,
  setResponsibleSearch,
  users,
  error,
  currentTemplateId,
  onSave,
  onFileUpload,
  onAddStep,
  onEditStep,
  onDeleteStep,
  onFetchStepDetails,
  onClose,
}) => {
  const [showEditStepModal, setShowEditStepModal] = useState(false);
  const [showAssignNextStepsModal, setShowAssignNextStepsModal] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [assigningStep, setAssigningStep] = useState(null);
  const [filteredViewerUsers, setFilteredViewerUsers] = useState([]);
  const [filteredResponsibleUsers, setFilteredResponsibleUsers] = useState([]);

  useEffect(() => {
    const fetchViewerUsers = async () => {
      try {
        const searchedUsers = await searchUsersByName(viewerSearch);
        const validUsers = searchedUsers.filter((user) =>
          ['staff', 'admin'].includes(user.role)
        );
        setFilteredViewerUsers(validUsers);
      } catch (err) {
        console.error('خطا در جستجوی ناظران:', err);
      }
    };
    fetchViewerUsers();
  }, [viewerSearch]);

  useEffect(() => {
    const fetchResponsibleUsers = async () => {
      try {
        const searchedUsers = await searchUsersByName(responsibleSearch);
        const validUsers = searchedUsers.filter((user) =>
          ['staff', 'admin'].includes(user.role)
        );
        setFilteredResponsibleUsers(validUsers);
      } catch (err) {
        console.error('خطا در جستجوی کاربران مسئول:', err);
      }
    };
    fetchResponsibleUsers();
  }, [responsibleSearch]);

  const handleEditStep = (step) => {
    setEditingStep(step);
    setShowEditStepModal(true);
  };

  const handleAssignNextSteps = (step) => {
    setAssigningStep(step);
    setShowAssignNextStepsModal(true);
  };

  const handleSaveStep = (updatedStepData) => {
    onEditStep(currentTemplateId, editingStep.id, updatedStepData);
    setShowEditStepModal(false);
    setEditingStep(null);
  };

  const handleSaveNextSteps = (updatedStepData) => {
    onEditStep(currentTemplateId, assigningStep.id, {
      ...assigningStep,
      next_step_on_success: updatedStepData.next_step_on_success,
      next_step_on_failure: updatedStepData.next_step_on_failure,
    });
    setShowAssignNextStepsModal(false);
    setAssigningStep(null);
  };

  const getStepDisplay = (stepId) => {
    const step = templateSteps.find((s) => s.id === stepId);
    return step ? `${step.id}: ${step.description}` : '-';
  };

  return (
    <div css={popupStyles} onClick={onClose}>
      <div css={popupContentStyles} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold mb-4">{isEditing ? 'ویرایش الگوی گردش کار' : 'افزودن الگوی گردش کار'}</h3>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <input
            type="text"
            placeholder="عنوان"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
            required
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
          >
            <option value="Draft">پیش‌نویس</option>
            <option value="Active">فعال</option>
            <option value="Completed">تکمیل‌شده</option>
          </select>
          <input
            type="number"
            placeholder="شناسه تأییدکننده (اختیاری)"
            value={formData.approver_id}
            onChange={(e) => setFormData({ ...formData, approver_id: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="number"
            placeholder="شناسه گردش کار والد (اختیاری)"
            value={formData.parent_workflow_id}
            onChange={(e) => setFormData({ ...formData, parent_workflow_id: e.target.value })}
            className="w-full p-2 mb-4 border rounded"
          />
          <div className="mb-4">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full p-2 border rounded"
            />
            <button
              type="button"
              onClick={onFileUpload}
              className="bg-blue-500 text-white px-4 py-2 mt-2 rounded hover:bg-blue-600"
            >
              بارگذاری فایل
            </button>
            {formData.uploaded_files.length > 0 && (
              <ul className="mt-2">
                {formData.uploaded_files.map((url, index) => (
                  <li key={index} className="text-sm text-blue-600">
                    <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="text"
            placeholder="جستجوی ناظران (نام یا نام خانوادگی)..."
            value={viewerSearch}
            onChange={(e) => setViewerSearch(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
          />
          <select
            multiple
            value={formData.viewer_ids}
            onChange={(e) =>
              setFormData({
                ...formData,
                viewer_ids: Array.from(e.target.selectedOptions, (option) => parseInt(option.value)),
              })
            }
            className="w-full p-2 mb-4 border rounded"
          >
            {filteredViewerUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} {user.last_name} ({user.role})
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="جستجوی کاربران مسئول (نام یا نام خانوادگی)..."
            value={responsibleSearch}
            onChange={(e) => setResponsibleSearch(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
          />
          <select
            multiple
            value={formData.responsible_user_ids}
            onChange={(e) =>
              setFormData({
                ...formData,
                responsible_user_ids: Array.from(e.target.selectedOptions, (option) => parseInt(option.value)),
              })
            }
            className="w-full p-2 mb-4 border rounded"
          >
            {filteredResponsibleUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} {user.last_name} ({user.role})
              </option>
            ))}
          </select>
          {isEditing && (
            <>
              <div css={stepFormStyles}>
                <h4 className="text-lg font-semibold mb-2">افزودن مرحله الگو</h4>
                <input
                  type="number"
                  placeholder="شماره مرحله"
                  value={stepFormData.step_number}
                  onChange={(e) => setStepFormData({ ...stepFormData, step_number: e.target.value })}
                  className="w-full p-2 mb-2 border rounded"
                  required
                />
                <textarea
                  placeholder="توضیحات"
                  value={stepFormData.description}
                  onChange={(e) => setStepFormData({ ...stepFormData, description: e.target.value })}
                  className="w-full p-2 mb-2 border rounded"
                  required
                />
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={stepFormData.is_mandatory}
                    onChange={(e) => setStepFormData({ ...stepFormData, is_mandatory: e.target.checked })}
                    className="mr-2"
                  />
                  اجباری
                </label>
                <input
                  type="number"
                  placeholder="مدت زمان پیش‌فرض (اختیاری)"
                  value={stepFormData.default_expected_duration}
                  onChange={(e) => setStepFormData({ ...stepFormData, default_expected_duration: e.target.value })}
                  className="w-full p-2 mb-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="مستندات مورد نیاز (اختیاری)"
                  value={stepFormData.default_required_documents}
                  onChange={(e) => setStepFormData({ ...stepFormData, default_required_documents: e.target.value })}
                  className="w-full p-2 mb-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="خروجی پیش‌فرض (اختیاری)"
                  value={stepFormData.default_output}
                  onChange={(e) => setStepFormData({ ...stepFormData, default_output: e.target.value })}
                  className="w-full p-2 mb-2 border rounded"
                />
                <button
                  type="button"
                  onClick={onAddStep}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  افزودن مرحله
                </button>
              </div>
              {templateSteps.length > 0 && (
                <div css={stepTableStyles}>
                  <h4 className="text-lg font-semibold mb-2">مراحل الگو</h4>
                  <table className="w-full bg-white rounded-lg">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="p-2 text-right">شماره</th>
                        <th className="p-2 text-right">توضیحات</th>
                        <th className="p-2 text-right">اجباری</th>
                        <th className="p-2 text-right">موفقیت</th>
                        <th className="p-2 text-right">شکست</th>
                        <th className="p-2 text-right">اقدامات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templateSteps.map((step) => (
                        <tr key={step.id} className="border-t">
                          <td className="p-2">{step.step_number}</td>
                          <td className="p-2">{step.description}</td>
                          <td className="p-2">{step.is_mandatory ? 'بله' : 'خیر'}</td>
                          <td className="p-2">{getStepDisplay(step.next_step_on_success)}</td>
                          <td className="p-2">{getStepDisplay(step.next_step_on_failure)}</td>
                          <td className="p-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => onFetchStepDetails(currentTemplateId, step.id)}
                                className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                              >
                                مشاهده
                              </button>
                              <button
                                onClick={() => handleEditStep(step)}
                                className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                              >
                                ویرایش
                              </button>
                              <button
                                onClick={() => handleAssignNextSteps(step)}
                                className="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                              >
                                تعیین مراحل بعدی
                              </button>
                              <button
                                onClick={() => onDeleteStep(currentTemplateId, step.id)}
                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                              >
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              ذخیره الگو
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
        {showEditStepModal && editingStep && (
          <EditStepModal
            step={editingStep}
            error={error}
            onSave={handleSaveStep}
            onClose={() => {
              setShowEditStepModal(false);
              setEditingStep(null);
            }}
          />
        )}
        {showAssignNextStepsModal && assigningStep && (
          <AssignNextStepsModal
            step={assigningStep}
            templateSteps={templateSteps}
            error={error}
            onSave={handleSaveNextSteps}
            onClose={() => {
              setShowAssignNextStepsModal(false);
              setAssigningStep(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WorkflowTemplateForm;