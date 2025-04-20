/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tree, TreeNode } from 'react-organizational-chart';
import Navbar from '../../components/Navbar';
import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getUserProfile,
  searchUsersByName,
  createWorkflowStep,
  getWorkflowSteps,
  uploadFile,
} from '../../api/api';
import { isAuthenticated } from '../../api/auth';
import { containerStyles } from '../style';

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

const chartPopupStyles = css`
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 1200px;
  direction: ltr;
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

const stepDetailsModalStyles = css`
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  width: 90%;
  max-width: 600px;
  direction: rtl;
  box-sizing: border-box;
`;

const paginationStyles = css`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
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

const AdminWorkflows = () => {
  const [workflows, setWorkflows] = useState([]);
  const [workflowSteps, setWorkflowSteps] = useState([]);
  const [totalSteps, setTotalSteps] = useState(0);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showChartPopup, setShowChartPopup] = useState(false);
  const [showStepDetails, setShowStepDetails] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    status: 'Draft',
    approver_id: '',
    is_template: false,
    uploaded_files: [],
    parent_workflow_id: '',
    viewer_ids: [],
    responsible_user_ids: [],
  });
  const [stepFormData, setStepFormData] = useState({
    step_number: '',
    description: '',
    status: 'Pending',
    is_mandatory: false,
    is_additional: false,
    expected_duration: '',
    required_documents: '',
    output: '',
    escalation_contact_id: '',
    uploaded_files: [],
    completed_at: '',
    completed_by: '',
    responsible_user_ids: [],
  });
  const [users, setUsers] = useState([]);
  const [viewerSearch, setViewerSearch] = useState('');
  const [responsibleSearch, setResponsibleSearch] = useState('');
  const [stepResponsibleSearch, setStepResponsibleSearch] = useState('');
  const [escalationSearch, setEscalationSearch] = useState('');
  const [file, setFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [stepsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isAuthenticated()) throw new Error('لطفاً وارد شوید');

        const user = await getUserProfile();
        setCurrentUser(user);

        if (user.role !== 'admin') throw new Error('فقط مدیران می‌توانند به این صفحه دسترسی داشته باشند');

        const workflows = await getWorkflows();
        const nonTemplateWorkflows = workflows.filter((w) => !w.is_template);
        setWorkflows(nonTemplateWorkflows || []);

        // Fetch initial users for dropdowns
        const initialUsers = await searchUsersByName('', 0, 100);
        setUsers(initialUsers || []);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری داده‌ها');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchWorkflowSteps = async (workflowId, page = 1) => {
    try {
      const skip = (page - 1) * stepsPerPage;
      const steps = await getWorkflowSteps(workflowId, skip, stepsPerPage);
      setWorkflowSteps(steps || []);
      // Fetch total steps (workaround since API doesn't return total)
      const allSteps = await getWorkflowSteps(workflowId, 0, 1000); // Large limit to get total
      setTotalSteps(allSteps.length);
    } catch (err) {
      setError(err.message || 'خطا در دریافت مراحل گردش کار');
    }
  };

  const handleSearchUsers = async (search, setState) => {
    try {
      const searchedUsers = await searchUsersByName(search, 0, 100);
      setState(searchedUsers || []);
    } catch (err) {
      setError('خطا در جستجوی کاربران');
    }
  };

  const handleSaveWorkflow = async () => {
    if (currentUser?.role !== 'admin') {
      setError('فقط مدیران می‌توانند گردش کار را اضافه یا ویرایش کنند.');
      return;
    }
    try {
      const preparedData = {
        title: formData.title,
        status: formData.status,
        approver_id: formData.approver_id && formData.approver_id !== '0' ? parseInt(formData.approver_id) : null,
        is_template: false,
        uploaded_files: formData.uploaded_files,
        parent_workflow_id: formData.parent_workflow_id && formData.parent_workflow_id !== '0' ? parseInt(formData.parent_workflow_id) : null,
        viewer_ids: formData.viewer_ids.map(Number),
        responsible_user_ids: formData.responsible_user_ids.map(Number),
      };

      let updatedWorkflow;
      if (isEditing) {
        updatedWorkflow = await updateWorkflow(currentWorkflowId, preparedData);
        setWorkflows(workflows.map((w) => (w.id === currentWorkflowId ? updatedWorkflow : w)));
      } else {
        updatedWorkflow = await createWorkflow(preparedData);
        setWorkflows([...workflows, updatedWorkflow]);
        setCurrentWorkflowId(updatedWorkflow.id);
        setIsEditing(true);
      }

      setShowPopup(true);
      resetForm();
      setError(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleEditWorkflow = (workflow) => {
    setFormData({
      title: workflow.title,
      status: workflow.status,
      approver_id: workflow.approver_id?.toString() || '',
      is_template: false,
      uploaded_files: workflow.uploaded_files || [],
      parent_workflow_id: workflow.parent_workflow_id?.toString() || '',
      viewer_ids: workflow.viewers ? workflow.viewers.map((v) => v.id) : [],
      responsible_user_ids: workflow.responsible_users ? workflow.responsible_users.map((r) => r.id) : [],
    });
    setCurrentWorkflowId(workflow.id);
    setIsEditing(true);
    setShowPopup(true);
    setCurrentPage(1);
    fetchWorkflowSteps(workflow.id, 1);
  };

  const handleDeleteWorkflow = async (workflowId) => {
    if (currentUser?.role !== 'admin') {
      setError('فقط مدیران می‌توانند گردش کار را حذف کنند.');
      return;
    }
    try {
      await deleteWorkflow(workflowId);
      setWorkflows(workflows.filter((w) => w.id !== workflowId));
      setError(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleFileUpload = async (isStepFile = false) => {
    if (!file) {
      setError('لطفاً یک فایل انتخاب کنید');
      return;
    }
    try {
      const uploaded = await uploadFile(file, false);
      if (isStepFile) {
        setStepFormData({ ...stepFormData, uploaded_files: [...stepFormData.uploaded_files, uploaded.file_url] });
      } else {
        setFormData({ ...formData, uploaded_files: [...formData.uploaded_files, uploaded.file_url] });
      }
      setFile(null);
      setError(null);
    } catch (err) {
      setError(err.message || 'خطا در بارگذاری فایل');
    }
  };

  const handleAddStep = async () => {
    if (!currentWorkflowId) {
      setError('ابتدا گردش کار را ذخیره کنید');
      return;
    }
    try {
      const preparedStepData = {
        step_number: parseInt(stepFormData.step_number),
        description: stepFormData.description,
        status: stepFormData.status,
        is_mandatory: stepFormData.is_mandatory,
        is_additional: stepFormData.is_additional,
        expected_duration: stepFormData.expected_duration ? parseInt(stepFormData.expected_duration) : null,
        required_documents: stepFormData.required_documents || null,
        output: stepFormData.output || null,
        escalation_contact_id: stepFormData.escalation_contact_id && stepFormData.escalation_contact_id !== '0' ? parseInt(stepFormData.escalation_contact_id) : null,
        uploaded_files: stepFormData.uploaded_files,
        completed_at: stepFormData.completed_at ? new Date(stepFormData.completed_at).toISOString() : null,
        completed_by: stepFormData.completed_by || null,
        responsible_user_ids: stepFormData.responsible_user_ids.map(Number),
      };
      const newStep = await createWorkflowStep(currentWorkflowId, preparedStepData);
      setWorkflowSteps([...workflowSteps, newStep]);
      setTotalSteps(totalSteps + 1);
      resetStepForm();
      setError(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleViewStep = (step) => {
    setSelectedStep(step);
    setShowStepDetails(true);
  };

  const handleError = (err) => {
    if (err.response?.status === 422) {
      const validationErrors = err.response.data.detail;
      const errorMessage = validationErrors
        .map((e) => `خطا در ${e.loc.join(' -> ')}: ${e.msg}`)
        .join(', ');
      setError(errorMessage || 'خطا در ذخیره داده‌ها: داده‌ها نامعتبر است');
    } else if (err.response?.status === 400) {
      setError(err.response.data.detail || 'گردش کار یا مرحله با این مشخصات قبلاً وجود دارد');
    } else if (err.response?.status === 403) {
      setError('عدم دسترسی به این عملیات');
    } else if (err.response?.status === 404) {
      setError('منبع مورد نظر یافت نشد');
    } else {
      setError(err.message || 'خطا در عملیات');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      status: 'Draft',
      approver_id: '',
      is_template: false,
      uploaded_files: [],
      parent_workflow_id: '',
      viewer_ids: [],
      responsible_user_ids: [],
    });
    resetStepForm();
    setWorkflowSteps([]);
    setTotalSteps(0);
    setCurrentPage(1);
  };

  const resetStepForm = () => {
    setStepFormData({
      step_number: '',
      description: '',
      status: 'Pending',
      is_mandatory: false,
      is_additional: false,
      expected_duration: '',
      required_documents: '',
      output: '',
      escalation_contact_id: '',
      uploaded_files: [],
      completed_at: '',
      completed_by: '',
      responsible_user_ids: [],
    });
    setStepResponsibleSearch('');
    setEscalationSearch('');
  };

  const filteredViewerUsers = users.filter(
    (user) =>
      ['staff', 'admin'].includes(user.role) &&
      (viewerSearch ? user.username.toLowerCase().includes(viewerSearch.toLowerCase()) : true)
  );

  const filteredResponsibleUsers = users.filter(
    (user) =>
      user.role === 'staff' &&
      (responsibleSearch ? user.username.toLowerCase().includes(responsibleSearch.toLowerCase()) : true)
  );

  const filteredStepResponsibleUsers = users.filter(
    (user) =>
      user.role === 'staff' &&
      (stepResponsibleSearch ? user.username.toLowerCase().includes(stepResponsibleSearch.toLowerCase()) : true)
  );

  const filteredEscalationUsers = users.filter(
    (user) =>
      ['staff', 'admin'].includes(user.role) &&
      (escalationSearch ? user.username.toLowerCase().includes(escalationSearch.toLowerCase()) : true)
  );

  // Pagination logic
  const totalPages = Math.ceil(totalSteps / stepsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    if (currentWorkflowId) {
      fetchWorkflowSteps(currentWorkflowId, pageNumber);
    }
  };

  const renderStepNode = (step) => (
    <TreeNode
      label={
        <div css={nodeStyles}>
          <div className="font-bold">مرحله {step.step_number}</div>
          <div>{step.description}</div>
          <div className="text-sm text-gray-600">
            {step.is_mandatory ? 'اجباری' : 'اختیاری'} | {step.status}
          </div>
        </div>
      }
    />
  );

  if (loading) return <div css={containerStyles}>در حال بارگذاری...</div>;
  if (error && !showPopup && !showStepDetails && !showChartPopup) return <div css={containerStyles} className="text-red-500 text-center mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">مدیریت گردش کار</h1>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                setShowPopup(true);
                setIsEditing(false);
                resetForm();
              }}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
            >
              افزودن گردش کار
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-right">عنوان</th>
                <th className="p-3 text-right">وضعیت</th>
                <th className="p-3 text-right">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {workflows.map((workflow) => (
                <tr
                  key={workflow.id}
                  onClick={() => navigate(`/workflows/${workflow.id}`)}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-3">{workflow.title || 'بدون عنوان'}</td>
                  <td className="p-3">{workflow.status || 'بدون وضعیت'}</td>
                  <td className="p-3">
                    {currentUser?.role === 'admin' && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditWorkflow(workflow);
                          }}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorkflow(workflow.id);
                          }}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          حذف
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showPopup && currentUser?.role === 'admin' && (
        <div css={popupStyles} onClick={() => { setShowPopup(false); setError(null); resetForm(); }}>
          <div css={popupContentStyles} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">{isEditing ? 'ویرایش گردش کار' : 'افزودن گردش کار'}</h3>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <form onSubmit={(e) => { e.preventDefault(); handleSaveWorkflow(); }}>
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
                min="1"
              />
              <input
                type="number"
                placeholder="شناسه گردش کار والد (اختیاری)"
                value={formData.parent_workflow_id}
                onChange={(e) => setFormData({ ...formData, parent_workflow_id: e.target.value })}
                className="w-full p-2 mb-4 border rounded"
                min="1"
              />
              <div className="mb-4">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={() => handleFileUpload(false)}
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
                placeholder="جستجوی ناظران..."
                value={viewerSearch}
                onChange={(e) => {
                  setViewerSearch(e.target.value);
                  handleSearchUsers(e.target.value, setUsers);
                }}
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
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="جستجوی کاربران مسئول..."
                value={responsibleSearch}
                onChange={(e) => {
                  setResponsibleSearch(e.target.value);
                  handleSearchUsers(e.target.value, setUsers);
                }}
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
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
              {isEditing && (
                <>
                  <div css={stepFormStyles}>
                    <h4 className="text-lg font-semibold mb-2">افزودن مرحله گردش کار</h4>
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
                    <select
                      value={stepFormData.status}
                      onChange={(e) => setStepFormData({ ...stepFormData, status: e.target.value })}
                      className="w-full p-2 mb-2 border rounded"
                    >
                      <option value="Pending">در انتظار</option>
                      <option value="InProgress">در حال انجام</option>
                      <option value="Completed">تکمیل‌شده</option>
                      <option value="Failed">ناموفق</option>
                    </select>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={stepFormData.is_mandatory}
                        onChange={(e) => setStepFormData({ ...stepFormData, is_mandatory: e.target.checked })}
                        className="mr-2"
                      />
                      اجباری
                    </label>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={stepFormData.is_additional}
                        onChange={(e) => setStepFormData({ ...stepFormData, is_additional: e.target.checked })}
                        className="mr-2"
                      />
                      مرحله اضافی
                    </label>
                    <input
                      type="number"
                      placeholder="مدت زمان مورد انتظار (اختیاری)"
                      value={stepFormData.expected_duration}
                      onChange={(e) => setStepFormData({ ...stepFormData, expected_duration: e.target.value })}
                      className="w-full p-2 mb-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="مستندات مورد نیاز (اختیاری)"
                      value={stepFormData.required_documents}
                      onChange={(e) => setStepFormData({ ...stepFormData, required_documents: e.target.value })}
                      className="w-full p-2 mb-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="خروجی (اختیاری)"
                      value={stepFormData.output}
                      onChange={(e) => setStepFormData({ ...stepFormData, output: e.target.value })}
                      className="w-full p-2 mb-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="جستجوی تماس تشدید..."
                      value={escalationSearch}
                      onChange={(e) => {
                        setEscalationSearch(e.target.value);
                        handleSearchUsers(e.target.value, setUsers);
                      }}
                      className="w-full p-2 mb-2 border rounded"
                    />
                    <select
                      value={stepFormData.escalation_contact_id}
                      onChange={(e) => setStepFormData({ ...stepFormData, escalation_contact_id: e.target.value })}
                      className="w-full p-2 mb-2 border rounded"
                    >
                      <option value="">هیچکدام</option>
                      {filteredEscalationUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.role})
                        </option>
                      ))}
                    </select>
                    <div className="mb-4">
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="w-full p-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleFileUpload(true)}
                        className="bg-blue-500 text-white px-4 py-2 mt-2 rounded hover:bg-blue-600"
                      >
                        بارگذاری فایل مرحله
                      </button>
                      {stepFormData.uploaded_files.length > 0 && (
                        <ul className="mt-2">
                          {stepFormData.uploaded_files.map((url, index) => (
                            <li key={index} className="text-sm text-blue-600">
                              <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      placeholder="زمان تکمیل (اختیاری)"
                      value={stepFormData.completed_at}
                      onChange={(e) => setStepFormData({ ...stepFormData, completed_at: e.target.value })}
                      className="w-full p-2 mb-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="تکمیل شده توسط (اختیاری)"
                      value={stepFormData.completed_by}
                      onChange={(e) => setStepFormData({ ...stepFormData, completed_by: e.target.value })}
                      className="w-full p-2 mb-2 border rounded"
                    />
                    <input
                      type="text"
                      placeholder="جستجوی کاربران مسئول مرحله..."
                      value={stepResponsibleSearch}
                      onChange={(e) => {
                        setStepResponsibleSearch(e.target.value);
                        handleSearchUsers(e.target.value, setUsers);
                      }}
                      className="w-full p-2 mb-2 border rounded"
                    />
                    <select
                      multiple
                      value={stepFormData.responsible_user_ids}
                      onChange={(e) =>
                        setStepFormData({
                          ...stepFormData,
                          responsible_user_ids: Array.from(e.target.selectedOptions, (option) => parseInt(option.value)),
                        })
                      }
                      className="w-full p-2 mb-2 border rounded"
                    >
                      {filteredStepResponsibleUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.role})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      افزودن مرحله
                    </button>
                  </div>
                  {workflowSteps.length > 0 && (
                    <div css={stepTableStyles}>
                      <h4 className="text-lg font-semibold mb-2">مراحل گردش کار</h4>
                      <button
                        onClick={() => setShowChartPopup(true)}
                        className="bg-purple-500 text-white px-4 py-2 mb-4 rounded hover:bg-purple-600"
                      >
                        نمایش نمودار
                      </button>
                      <table className="w-full bg-white rounded-lg">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="p-2 text-right">شماره</th>
                            <th className="p-2 text-right">توضیحات</th>
                            <th className="p-2 text-right">وضعیت</th>
                            <th className="p-2 text-right">اجباری</th>
                            <th className="p-2 text-right">اضافی</th>
                            <th className="p-2 text-right">اقدامات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {workflowSteps.map((step) => (
                            <tr key={step.id} className="border-t">
                              <td className="p-2">{step.step_number}</td>
                              <td className="p-2">{step.description}</td>
                              <td className="p-2">{step.status}</td>
                              <td className="p-2">{step.is_mandatory ? 'بله' : 'خیر'}</td>
                              <td className="p-2">{step.is_additional ? 'بله' : 'خیر'}</td>
                              <td className="p-2">
                                <button
                                  onClick={() => handleViewStep(step)}
                                  className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                >
                                  مشاهده
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div css={paginationStyles}>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => paginate(page)}
                            className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  ذخیره گردش کار
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPopup(false); setError(null); resetForm(); }}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  لغو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showChartPopup && workflowSteps.length > 0 && (
        <div css={popupStyles} onClick={() => setShowChartPopup(false)}>
          <div css={chartPopupStyles} onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-semibold mb-2">نمودار مراحل گردش کار</h4>
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
              {workflowSteps
                .sort((a, b) => a.step_number - b.step_number)
                .map((step) => renderStepNode(step))}
            </Tree>
            <button
              onClick={() => setShowChartPopup(false)}
              className="bg-gray-500 text-white px-4 py-2 mt-4 rounded hover:bg-gray-600"
            >
              بستن
            </button>
          </div>
        </div>
      )}
      {showStepDetails && selectedStep && (
        <div css={popupStyles} onClick={() => { setShowStepDetails(false); setSelectedStep(null); setError(null); }}>
          <div css={stepDetailsModalStyles} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">جزئیات مرحله گردش کار</h3>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="mb-2">
              <strong>شماره مرحله:</strong> {selectedStep.step_number}
            </div>
            <div className="mb-2">
              <strong>توضیحات:</strong> {selectedStep.description}
            </div>
            <div className="mb-2">
              <strong>وضعیت:</strong> {selectedStep.status}
            </div>
            <div className="mb-2">
              <strong>اجباری:</strong> {selectedStep.is_mandatory ? 'بله' : 'خیر'}
            </div>
            <div className="mb-2">
              <strong>مرحله اضافی:</strong> {selectedStep.is_additional ? 'بله' : 'خیر'}
            </div>
            <div className="mb-2">
              <strong>مدت زمان مورد انتظار:</strong> {selectedStep.expected_duration || '-'}
            </div>
            <div className="mb-2">
              <strong>مستندات مورد نیاز:</strong> {selectedStep.required_documents || '-'}
            </div>
            <div className="mb-2">
              <strong>خروجی:</strong> {selectedStep.output || '-'}
            </div>
            <div className="mb-2">
              <strong>شناسه تماس تشدید:</strong> {selectedStep.escalation_contact_id || '-'}
            </div>
            <div className="mb-2">
              <strong>فایل‌های بارگذاری‌شده:</strong>
              {selectedStep.uploaded_files?.length > 0 ? (
                <ul>
                  {selectedStep.uploaded_files.map((url, index) => (
                    <li key={index}>
                      <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
                    </li>
                  ))}
                </ul>
              ) : '-'}
            </div>
            <div className="mb-2">
              <strong>زمان تکمیل:</strong> {selectedStep.completed_at ? new Date(selectedStep.completed_at).toLocaleString('fa-IR') : '-'}
            </div>
            <div className="mb-2">
              <strong>تکمیل شده توسط:</strong> {selectedStep.completed_by || '-'}
            </div>
            <div className="mb-2">
              <strong>کاربران مسئول:</strong>
              {selectedStep.responsible_users?.length > 0
                ? selectedStep.responsible_users.map((u) => u.username).join(', ')
                : '-'}
            </div>
            <button
              onClick={() => { setShowStepDetails(false); setSelectedStep(null); setError(null); }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 mt-4"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkflows;