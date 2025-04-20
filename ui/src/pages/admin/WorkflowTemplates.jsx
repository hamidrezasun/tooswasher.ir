/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import WorkflowTemplateForm from '../../components/workflow/WorkflowTemplateForm';
import StepDetailsModal from '../../components/workflow/StepDetailsModal';
import WorkflowChart from '../../components/workflow/WorkflowChart';
import {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getUserProfile,
  getAllUsers,
  createWorkflowStepTemplate,
  updateWorkflowStepTemplate,
  deleteWorkflowStepTemplate,
  getTemplateSteps,
  getTemplateStep,
  uploadFile,
} from '../../api/api';
import { isAuthenticated } from '../../api/auth';
import { containerStyles } from '../style';

const WorkflowTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [templateSteps, setTemplateSteps] = useState([]);
  const [error, setError] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showStepDetails, setShowStepDetails] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    status: 'Draft',
    approver_id: '',
    is_template: true,
    uploaded_files: [],
    parent_workflow_id: '',
    viewer_ids: [],
    responsible_user_ids: [],
  });
  const [stepFormData, setStepFormData] = useState({
    step_number: '',
    description: '',
    is_mandatory: false,
    default_expected_duration: '',
    default_required_documents: '',
    default_output: '',
  });
  const [users, setUsers] = useState([]);
  const [viewerSearch, setViewerSearch] = useState('');
  const [responsibleSearch, setResponsibleSearch] = useState('');
  const [file, setFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isAuthenticated()) throw new Error('لطفاً وارد شوید');

        const user = await getUserProfile();
        setCurrentUser(user);

        const workflows = await getWorkflows();
        const templateWorkflows = workflows.filter((w) => w.is_template);
        setTemplates(templateWorkflows || []);

        if (user.role === 'admin') {
          const allUsers = await getAllUsers();
          setUsers(allUsers || []);
        }
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری داده‌ها');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchTemplateSteps = async (workflowId) => {
    try {
      const steps = await getTemplateSteps(workflowId);
      setTemplateSteps(steps || []);
    } catch (err) {
      setError(err.message || 'خطا در دریافت مراحل الگو');
    }
  };

  const fetchStepDetails = async (workflowId, stepId) => {
    try {
      const step = await getTemplateStep(workflowId, stepId);
      setSelectedStep(step);
      setShowStepDetails(true);
    } catch (err) {
      setError(err.message || 'خطا در دریافت جزئیات مرحله');
    }
  };

  const handleSaveTemplate = async () => {
    if (currentUser?.role !== 'admin') {
      setError('فقط مدیران می‌توانند الگوهای گردش کار را اضافه یا ویرایش کنند.');
      return;
    }
    try {
      const preparedData = {
        title: formData.title,
        status: formData.status,
        approver_id: formData.approver_id ? parseInt(formData.approver_id) : null,
        is_template: true,
        uploaded_files: formData.uploaded_files,
        parent_workflow_id: formData.parent_workflow_id ? parseInt(formData.parent_workflow_id) : null,
        viewer_ids: formData.viewer_ids.map(Number),
        responsible_user_ids: formData.responsible_user_ids.map(Number),
      };

      let updatedTemplate;
      if (isEditing) {
        updatedTemplate = await updateWorkflow(currentTemplateId, preparedData);
        setTemplates(templates.map((t) => (t.id === currentTemplateId ? updatedTemplate : t)));
      } else {
        updatedTemplate = await createWorkflow(preparedData);
        setTemplates([...templates, updatedTemplate]);
        setCurrentTemplateId(updatedTemplate.id);
        setIsEditing(true);
      }

      setShowPopup(true);
      resetForm();
      setError(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleCreateWorkflowFromTemplate = async (templateId) => {
    if (currentUser?.role !== 'admin') {
      setError('فقط مدیران می‌توانند گردش کار ایجاد کنند.');
      return;
    }
    try {
      const template = templates.find((t) => t.id === templateId);
      if (!template) throw new Error('الگو یافت نشد');

      const workflowData = {
        title: `گردش کار: ${template.title}`,
        status: 'Draft',
        approver_id: template.approver_id ? parseInt(template.approver_id) : null,
        is_template: false,
        uploaded_files: template.uploaded_files || [],
        parent_workflow_id: template.id,
        viewer_ids: template.viewers ? template.viewers.map((v) => v.id) : [],
        responsible_user_ids: template.responsible_users ? template.responsible_users.map((r) => r.id) : [],
      };

      const newWorkflow = await createWorkflow(workflowData);
      navigate(`/workflows/${newWorkflow.id}`);
    } catch (err) {
      setError(err.message || 'خطا در ایجاد گردش کار');
    }
  };

  const handleEditTemplate = (template, addSteps = false) => {
    setFormData({
      title: template.title,
      status: template.status,
      approver_id: template.approver_id || '',
      is_template: true,
      uploaded_files: template.uploaded_files || [],
      parent_workflow_id: template.parent_workflow_id || '',
      viewer_ids: template.viewers ? template.viewers.map((v) => v.id) : [],
      responsible_user_ids: template.responsible_users ? template.responsible_users.map((r) => r.id) : [],
    });
    setCurrentTemplateId(template.id);
    setIsEditing(true);
    setShowPopup(true);
    if (addSteps) {
      fetchTemplateSteps(template.id);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (currentUser?.role !== 'admin') {
      setError('فقط مدیران می‌توانند الگوهای گردش کار را حذف کنند.');
      return;
    }
    try {
      await deleteWorkflow(templateId);
      setTemplates(templates.filter((t) => t.id !== templateId));
      setError(null);
    } catch (err) {
      setError(err.message || 'خطا در حذف الگو');
    }
  };

  const handleShowChart = (templateId) => {
    setSelectedTemplateId(templateId);
    fetchTemplateSteps(templateId);
    setShowChart(true);
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError('لطفاً یک فایل انتخاب کنید');
      return;
    }
    try {
      const uploaded = await uploadFile(file, false);
      setFormData({ ...formData, uploaded_files: [...formData.uploaded_files, uploaded.file_url] });
      setFile(null);
      setError(null);
    } catch (err) {
      setError(err.message || 'خطا در بارگذاری فایل');
    }
  };

  const handleAddStepTemplate = async () => {
    if (!currentTemplateId) {
      setError('ابتدا الگو را ذخیره کنید');
      return;
    }
    try {
      const preparedStepData = {
        step_number: parseInt(stepFormData.step_number),
        description: stepFormData.description,
        is_mandatory: stepFormData.is_mandatory,
        default_expected_duration: stepFormData.default_expected_duration ? parseInt(stepFormData.default_expected_duration) : null,
        default_required_documents: stepFormData.default_required_documents || null,
        default_output: stepFormData.default_output || null,
        next_step_on_success: null,
        next_step_on_failure: null,
      };
      const newStep = await createWorkflowStepTemplate(currentTemplateId, preparedStepData);
      setTemplateSteps([...templateSteps, newStep]);
      setStepFormData({
        step_number: '',
        description: '',
        is_mandatory: false,
        default_expected_duration: '',
        default_required_documents: '',
        default_output: '',
      });
      setError(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleEditStepTemplate = async (workflowId, stepId, updatedStepData) => {
    if (currentUser?.role !== 'admin') {
      setError('فقط مدیران می‌توانند مراحل الگو را ویرایش کنند.');
      return;
    }
    try {
      const preparedStepData = {
        step_number: parseInt(updatedStepData.step_number),
        description: updatedStepData.description,
        is_mandatory: updatedStepData.is_mandatory,
        default_expected_duration: updatedStepData.default_expected_duration ? parseInt(updatedStepData.default_expected_duration) : null,
        default_required_documents: updatedStepData.default_required_documents || null,
        default_output: updatedStepData.default_output || null,
        next_step_on_success: updatedStepData.next_step_on_success ? parseInt(updatedStepData.next_step_on_success) : null,
        next_step_on_failure: updatedStepData.next_step_on_failure ? parseInt(updatedStepData.next_step_on_failure) : null,
      };
      const updatedStep = await updateWorkflowStepTemplate(workflowId, stepId, preparedStepData);
      setTemplateSteps(templateSteps.map((step) => (step.id === stepId ? updatedStep : step)));
      setError(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleDeleteStepTemplate = async (workflowId, stepId) => {
    if (currentUser?.role !== 'admin') {
      setError('فقط مدیران می‌توانند مراحل الگو را حذف کنند.');
      return;
    }
    try {
      await deleteWorkflowStepTemplate(workflowId, stepId);
      setTemplateSteps(templateSteps.filter((step) => step.id !== stepId));
      setError(null);
    } catch (err) {
      setError(err.message || 'خطا در حذف مرحله الگو');
    }
  };

  const handleError = (err) => {
    if (err.response?.status === 422) {
      const validationErrors = err.response.data.detail;
      const errorMessage = validationErrors
        .map((e) => `خطا در ${e.loc.join(' -> ')}: ${e.msg}`)
        .join(', ');
      setError(errorMessage || 'خطا در ذخیره داده‌ها: داده‌ها نامعتبر است');
    } else if (err.response?.status === 400) {
      setError('الگو یا مرحله با این مشخصات قبلاً وجود دارد');
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
      is_template: true,
      uploaded_files: [],
      parent_workflow_id: '',
      viewer_ids: [],
      responsible_user_ids: [],
    });
    setStepFormData({
      step_number: '',
      description: '',
      is_mandatory: false,
      default_expected_duration: '',
      default_required_documents: '',
      default_output: '',
    });
    setTemplateSteps([]);
    setFile(null);
  };

  if (loading) return <div css={containerStyles}>در حال بارگذاری...</div>;
  if (error && !showPopup && !showStepDetails && !showChart) return <div css={containerStyles} className="text-red-500 text-center mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">الگوهای گردش کار</h1>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                setShowPopup(true);
                setIsEditing(false);
                resetForm();
              }}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition"
            >
              افزودن الگو
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-3 text-right">شناسه</th>
                <th className="p-3 text-right">عنوان</th>
                <th className="p-3 text-right">وضعیت</th>
                <th className="p-3 text-right">شناسه والد</th>
                <th className="p-3 text-right">اقدامات</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template) => (
                <tr
                  key={template.id}
                  onClick={() => navigate(`/workflow-templates/${template.id}`)}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-3">{template.id}</td>
                  <td className="p-3">{template.title || 'بدون عنوان'}</td>
                  <td className="p-3">{template.status || 'بدون وضعیت'}</td>
                  <td className="p-3">{template.parent_workflow_id || '-'}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {currentUser?.role === 'admin' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTemplate(template);
                            }}
                            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id);
                            }}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          >
                            حذف
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTemplate(template, true);
                            }}
                            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                          >
                            افزودن یا ویرایش مراحل
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateWorkflowFromTemplate(template.id);
                            }}
                            className="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                          >
                            ایجاد گردش کار
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowChart(template.id);
                        }}
                        className="bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                      >
                        نمایش نمودار
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">راهنمای استفاده از الگوهای گردش کار</h2>
          <p className="text-gray-600 mb-2">این صفحه به شما امکان می‌دهد الگوهای گردش کار را مشاهده، ایجاد، ویرایش و مدیریت کنید. در ادامه نحوه استفاده از این صفحه توضیح داده شده است:</p>
          <ul className="list-disc pr-5 text-gray-600">
            <li><strong>مشاهده الگوها:</strong> لیست الگوهای موجود در جدول نمایش داده می‌شود که شامل شناسه الگو، عنوان، وضعیت و شناسه والد (در صورت وجود) است. با کلیک روی هر الگو، به صفحه جزئیات آن منتقل می‌شوید.</li>
            <li><strong>ایجاد الگوی جدید:</strong> اگر مدیر هستید، با کلیک روی دکمه "افزودن الگو"، فرم ایجاد الگو باز می‌شود. اطلاعات مورد نیاز مانند عنوان، وضعیت، و کاربران مسئول را وارد کنید.</li>
            <li><strong>ویرایش الگو:</strong> در جدول، روی دکمه "ویرایش" کلیک کنید تا فرم ویرایش الگو باز شود. می‌توانید اطلاعات الگو و مراحل آن را تغییر دهید.</li>
            <li><strong>حذف الگو:</strong> با کلیک روی دکمه "حذف" در جدول، الگوی مورد نظر حذف می‌شود. این عملیات فقط برای مدیران قابل انجام است.</li>
            <li><strong>افزودن مراحل به الگو:</strong> با کلیک روی دکمه "افزودن مراحل" در جدول، فرم ویرایش الگو باز می‌شود و می‌توانید مراحل جدید به الگو اضافه کنید.</li>
            <li><strong>ویرایش مراحل الگو:</strong> در فرم ویرایش الگو، در جدول مراحل، روی دکمه "ویرایش" کلیک کنید تا فرم ویرایش مرحله باز شود و اطلاعات مرحله را به‌روزرسانی کنید.</li>
            <li><strong>تعیین مراحل بعدی:</strong> در جدول مراحل، روی دکمه "تعیین مراحل بعدی" کلیک کنید تا یک پاپ‌آپ باز شود و بتوانید مراحل بعدی در موفقیت و شکست را از بین مراحل موجود (بر اساس شناسه مرحله) انتخاب کنید.</li>
            <li><strong>حذف مراحل الگو:</strong> در جدول مراحل، روی دکمه "حذف" کلیک کنید تا مرحله مورد نظر حذف شود.</li>
            <li><strong>ایجاد گردش کار:</strong> با کلیک روی دکمه "ایجاد گردش کار"، یک گردش کار جدید بر اساس الگوی انتخاب‌شده ایجاد می‌شود و به صفحه آن منتقل می‌شوید.</li>
            <li><strong>مشاهده نمودار مراحل:</strong> با کلیک روی دکمه "نمایش نمودار" در جدول، یک پاپ‌آپ باز می‌شود که جریان مراحل الگو را به صورت بصری نمایش می‌دهد.</li>
            <li><strong>بارگذاری فایل:</strong> در فرم ایجاد یا ویرایش الگو، می‌توانید فایل‌های مرتبط را بارگذاری کنید.</li>
            <li><strong>جستجوی کاربران:</strong> برای انتخاب ناظران یا کاربران مسئول، نام یا نام خانوادگی کاربر را در فیلدهای جستجو وارد کنید تا کاربران با نقش‌های "کارمند" یا "مدیر" نمایش داده شوند.</li>
          </ul>
          <p className="text-gray-600 mt-2"><strong>نکته:</strong> فقط کاربران با نقش "مدیر" می‌توانند الگوها و مراحل آن‌ها را ایجاد، ویرایش، حذف یا گردش کار ایجاد کنند. سایر کاربران تنها می‌توانند الگوها را مشاهده کنند.</p>
        </div>
      </div>
      {showPopup && currentUser?.role === 'admin' && (
        <WorkflowTemplateForm
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
          stepFormData={stepFormData}
          setStepFormData={setStepFormData}
          templateSteps={templateSteps}
          setTemplateSteps={setTemplateSteps}
          file={file}
          setFile={setFile}
          viewerSearch={viewerSearch}
          setViewerSearch={setViewerSearch}
          responsibleSearch={responsibleSearch}
          setResponsibleSearch={setResponsibleSearch}
          users={users}
          error={error}
          currentTemplateId={currentTemplateId}
          onSave={handleSaveTemplate}
          onFileUpload={handleFileUpload}
          onAddStep={handleAddStepTemplate}
          onEditStep={handleEditStepTemplate}
          onDeleteStep={handleDeleteStepTemplate}
          onFetchStepDetails={fetchStepDetails}
          onClose={() => {
            setShowPopup(false);
            setError(null);
            resetForm();
          }}
        />
      )}
      {showStepDetails && selectedStep && (
        <StepDetailsModal
          step={selectedStep}
          templateSteps={templateSteps}
          error={error}
          onClose={() => {
            setShowStepDetails(false);
            setSelectedStep(null);
            setError(null);
          }}
        />
      )}
      {showChart && (
        <WorkflowChart
          steps={templateSteps}
          error={error}
          onClose={() => {
            setShowChart(false);
            setError(null);
            setTemplateSteps([]);
          }}
        />
      )}
    </div>
  );
};

export default WorkflowTemplates;