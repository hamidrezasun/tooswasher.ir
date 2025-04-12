/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import gjsBasicBlocks from 'grapesjs-blocks-basic';
import gjsPluginForms from 'grapesjs-plugin-forms';
import {
  getPages,
  createPage,
  updatePage,
  deletePage,
  getUserProfile,
  searchPages,
  getPageById
} from '../../api/api';
import { isAuthenticated } from '../../api/auth';
import { containerStyles } from '../style';

// CSS Styles
const searchBarStyles = css`
  width: 100%;
  max-width: 400px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
`;

const pageCardStyles = css`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const buttonStyles = css`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-left: 0.5rem;

  &:hover {
    opacity: 0.9;
  }
`;

const editButtonStyles = css`
  ${buttonStyles}
  background-color: #3b82f6;
  color: white;
`;

const deleteButtonStyles = css`
  ${buttonStyles}
  background-color: #ef4444;
  color: white;
`;

const addButtonStyles = css`
  ${buttonStyles}
  background-color: #10b981;
  color: white;
`;

const formStyles = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const inputStyles = css`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  width: 100%;
`;

const textareaStyles = css`
  ${inputStyles}
  min-height: 200px;
`;

const checkboxStyles = css`
  margin-left: 0.5rem;
`;

const editorContainerStyles = css`
  display: flex;
  min-height: 500px;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
`;

const editorPanelStyles = css`
  width: 300px;
  background: #f5f5f5;
  border-left: 1px solid #ccc;
  overflow-y: auto;
`;

const editorCanvasStyles = css`
  flex-grow: 1;
  background-color: white;
  position: relative;
`;

const AdminPages = () => {
  const [pages, setPages] = useState([]);
  const [filteredPages, setFilteredPages] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [selectedPage, setSelectedPage] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [useVisualEditor, setUseVisualEditor] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);
  const editorRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    body: '',
    is_in_menu: false
  });

  // Fetch pages and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated()) {
          const user = await getUserProfile();
          setIsAdmin(user.role === 'admin');
        }
        const data = await getPages();
        setPages(data || []);
        setFilteredPages(data || []);
      } catch (err) {
        setError(err.message || 'خطا در بارگذاری صفحات');
      }
    };
    fetchData();
  }, []);

  // Search functionality
  useEffect(() => {
    const search = async () => {
      if (searchTerm.trim() === '') {
        setFilteredPages(pages);
        return;
      }
      try {
        const data = await searchPages(searchTerm);
        setFilteredPages(data || []);
      } catch (err) {
        setError(err.message || 'خطا در جستجو');
      }
    };
    search();
  }, [searchTerm, pages]);

  // Initialize GrapesJS editor
  useEffect(() => {
    if (useVisualEditor && editorRef.current) {
      const editor = grapesjs.init({
        container: editorRef.current,
        fromElement: true,
        storageManager: false,
        rtl: true,
        panels: { defaults: [] },
        plugins: [
          gjsPresetWebpage,
          gjsBasicBlocks,
          gjsPluginForms
        ],
        pluginsOpts: {
          [gjsPresetWebpage]: {
            blocks: ['column1', 'column2', 'column3', 'column3-7', 'text', 'link', 'image', 'video'],
            flexGrid: true,
          },
          [gjsBasicBlocks]: {},
          [gjsPluginForms]: {}
        },
        blockManager: {
          appendTo: '#blocks',
          blocks: [
            {
              id: 'section',
              label: 'Section',
              category: 'Layout',
              content: '<section class="gjs-section" style="padding: 50px 0; max-width: 1200px; margin: 0 auto;"></section>',
            },
            {
              id: 'container',
              label: 'Container',
              category: 'Layout',
              content: '<div class="container" style="max-width: 1200px; margin: 0 auto;"></div>',
            },
            {
              id: 'row',
              label: 'Row',
              category: 'Layout',
              content: '<div class="row" style="display: flex; flex-wrap: wrap; gap: 15px; flex-direction: row;"></div>',
            },
            {
              id: 'column2',
              label: '2 Columns',
              category: 'Layout',
              content: `<div style="display: flex; gap: 15px; width: 100%; flex-direction: row;">
                <div style="flex: 1; min-width: 200px;"></div>
                <div style="flex: 1; min-width: 200px;"></div>
              </div>`,
            },
            {
              id: 'column3',
              label: '3 Columns',
              category: 'Layout',
              content: `<div style="display: flex; gap: 15px; width: 100%; flex-direction: row;">
                <div style="flex: 1; min-width: 200px;"></div>
                <div style="flex: 1; min-width: 200px;"></div>
                <div style="flex: 1; min-width: 200px;"></div>
              </div>`,
            },
            {
              id: 'text',
              label: 'Text',
              category: 'Basic',
              content: '<div class="gjs-text">متن خود را اینجا وارد کنید</div>',
            },
            {
              id: 'image',
              label: 'Image',
              category: 'Basic',
              content: '<img class="gjs-img" src="/placeholder-image.jpg" style="max-width:100%; height: auto;">',
            },
            {
              id: 'button',
              label: 'Button',
              category: 'Basic',
              content: '<button class="gjs-btn" style="padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px;">دکمه</button>',
            },
            {
              id: 'form',
              label: 'Form',
              category: 'Forms',
              content: '<form class="gjs-form" style="display: flex; flex-direction: column; gap: 10px;"></form>',
            },
            {
              id: 'input',
              label: 'Input',
              category: 'Forms',
              content: '<input type="text" class="gjs-input" placeholder="متن را وارد کنید" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">',
            },
            {
              id: 'video',
              label: 'Video',
              category: 'Media',
              content: `
                <div class="gjs-video">
                  <iframe width="560" height="315" src="https://www.youtube.com/embed/jNQXAC9IVRw" 
                  frameborder="0" allowfullscreen></iframe>
                </div>
              `,
            }
          ]
        },
        assetManager: {
          upload: false,
          assets: []
        },
        styleManager: {
          sectors: [{
            name: 'General',
            properties: [
              {
                name: 'Background',
                property: 'background',
                type: 'color',
              }, {
                name: 'Color',
                property: 'color',
                type: 'color',
              }, {
                name: 'Font Size',
                property: 'font-size',
                type: 'number',
                units: ['px', 'em'],
              }, {
                name: 'Text Align',
                property: 'text-align',
                type: 'radio',
                defaults: 'right',
                list: [
                  { value: 'right', name: 'Right', className: 'fa fa-align-right' },
                  { value: 'center', name: 'Center', className: 'fa fa-align-center' },
                  { value: 'left', name: 'Left', className: 'fa fa-align-left' },
                  { value: 'justify', name: 'Justify', className: 'fa fa-align-justify' }
                ],
              }
            ],
          }]
        }
      });

      // Apply RTL fixes
      const style = document.createElement('style');
      style.innerHTML = `
        .gjs-block {
          float: right;
        }
        .gjs-layer-item__name {
          text-align: right;
        }
        .gjs-sm-sector {
          text-align: right;
        }
        .gjs-sm-properties {
          direction: rtl;
        }
        .gjs-clm-tags {
          right: auto;
          left: 10px;
        }
        .gjs-clm-tag-status {
          float: left;
        }
        .gjs-pn-btn {
          float: left;
        }
        .gjs-one-bg {
          background-color: #f5f5f5;
        }
        .gjs-two-color {
          color: #777;
        }
        .gjs-three-bg {
          background-color: #3b97e3;
        }
        .gjs-four-color {
          color: #3b97e3;
        }
      `;
      document.head.appendChild(style);

      setEditorInstance(editor);
      
      if (selectedPage && formData.body) {
        editor.setComponents(formData.body);
      }

      editor.on('update', () => {
        setFormData(prev => ({
          ...prev,
          body: editor.getHtml()
        }));
      });

      return () => {
        editor.destroy();
        document.head.removeChild(style);
      };
    }
  }, [useVisualEditor, selectedPage]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSavePage = async (e) => {
    e.preventDefault();
    try {
      if (selectedPage) {
        const updated = await updatePage(selectedPage.id, formData);
        setPages(pages.map(p => p.id === updated.id ? updated : p));
        setFilteredPages(filteredPages.map(p => p.id === updated.id ? updated : p));
      } else {
        const newPage = await createPage(formData);
        setPages([...pages, newPage]);
        setFilteredPages([...filteredPages, newPage]);
      }
      resetForm();
    } catch (err) {
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.detail;
        const errorMessage = validationErrors
          .map((e) => `خطا در ${e.loc.join(' -> ')}: ${e.msg}`)
          .join(', ');
        setError(errorMessage || 'خطا در ذخیره صفحه: داده‌ها نامعتبر است');
      } else {
        setError(err.message || 'خطا در ذخیره صفحه');
      }
    }
  };

  const handleDeletePage = async (id) => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید این صفحه را حذف کنید؟')) {
      try {
        await deletePage(id);
        setPages(pages.filter(p => p.id !== id));
        setFilteredPages(filteredPages.filter(p => p.id !== id));
        if (selectedPage && selectedPage.id === id) {
          resetForm();
        }
      } catch (err) {
        setError(err.message || 'خطا در حذف صفحه');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', body: '', is_in_menu: false });
    setSelectedPage(null);
    setShowAddForm(false);
    setUseVisualEditor(false);
    if (editorInstance) {
      editorInstance.destroy();
      setEditorInstance(null);
    }
  };

  const handleEditPage = async (page) => {
    try {
      const fullPageData = await getPageById(page.id);
      setSelectedPage(fullPageData);
      setFormData({
        name: fullPageData.name,
        body: fullPageData.body || '',
        is_in_menu: fullPageData.is_in_menu || false
      });
      setShowAddForm(true);
      
      if (useVisualEditor && editorInstance) {
        editorInstance.setComponents(fullPageData.body || '');
      }
    } catch (err) {
      setError(err.message || 'خطا در بارگذاری صفحه');
    }
  };

  if (isAdmin === false) return <Navigate to="/" />;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">مدیریت صفحات</h1>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            css={addButtonStyles}
          >
            افزودن صفحه جدید
          </button>
        </div>

        <input
          type="text"
          placeholder="جستجوی صفحات..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          css={searchBarStyles}
        />

        {showAddForm && (
          <div css={pageCardStyles}>
            <h2 className="text-xl font-semibold">
              {selectedPage ? 'ویرایش صفحه' : 'افزودن صفحه جدید'}
            </h2>
            <form onSubmit={handleSavePage} css={formStyles}>
              <div>
                <label className="block mb-1">عنوان صفحه:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  css={inputStyles}
                />
              </div>
              <div>
                <label className="block mb-1 flex justify-between items-center">
                  <span>محتوای صفحه:</span>
                  <span>
                    <input
                      type="checkbox"
                      checked={useVisualEditor}
                      onChange={(e) => setUseVisualEditor(e.target.checked)}
                      css={checkboxStyles}
                    />{' '}
                    استفاده از ویرایشگر گرافیکی
                  </span>
                </label>
                {!useVisualEditor ? (
                  <textarea
                    name="body"
                    value={formData.body}
                    onChange={handleInputChange}
                    css={textareaStyles}
                  />
                ) : (
                  <div css={editorContainerStyles}>
                    <div css={editorCanvasStyles} ref={editorRef}></div>
                    <div css={editorPanelStyles}>
                      <div id="blocks"></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_in_menu"
                  checked={formData.is_in_menu}
                  onChange={handleInputChange}
                  css={checkboxStyles}
                />
                <label>نمایش در منو</label>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  css={editButtonStyles}
                >
                  {selectedPage ? 'ذخیره تغییرات' : 'افزودن'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">لیست صفحات</h2>
          {filteredPages.length === 0 ? (
            <p className="text-gray-500">هیچ صفحه‌ای یافت نشد</p>
          ) : (
            <div className="space-y-4">
              {filteredPages.map(page => (
                <div key={page.id} css={pageCardStyles}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-medium">{page.name}</h3>
                      {page.is_in_menu && (
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                          نمایش در منو
                        </span>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => handleEditPage(page)}
                        css={editButtonStyles}
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDeletePage(page.id)}
                        css={deleteButtonStyles}
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                  {page.body && (
                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <div dangerouslySetInnerHTML={{ __html: page.body.substring(0, 200) }} />
                      {page.body.length > 200 && '...'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPages;