/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { uploadFile, downloadFile, listFiles, getUserProfile, getUserById, deleteFile } from '../../api/api';
import { isAuthenticated } from '../../api/auth';
import { containerStyles } from '../style';
import moment from 'jalali-moment'

const searchBarStyles = css`
  width: 100%;
  max-width: 400px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  margin-bottom: 1.5rem;
`;

const fileSectionStyles = css`
  margin-bottom: 2rem;
`;

const fileTitleStyles = css`
  font-size: 1.5rem;
  font-weight: bold;
  color: #374151;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
`;

const fileCardStyles = css`
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const fileContentStyles = css`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
`;

const fileDetailsStyles = css`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const buttonContainerStyles = css`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const paginationStyles = css`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const buttonStyles = css`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background-color: #3b82f6;
  color: white;
  &:hover {
    background-color: #2563eb;
  }
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const downloadButtonStyles = css`
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  background-color: #10b981;
  color: white;
  &:hover {
    background-color: #059669;
  }
`;

const deleteButtonStyles = css`
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  background-color: #ef4444;
  color: white;
  &:hover {
    background-color: #dc2626;
  }
`;

const linkStyles = css`
  color: #2563eb;
  cursor: pointer;
  word-break: break-all;
  &:hover {
    color: #1d4ed8;
  }
`;

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalFiles, setTotalFiles] = useState(0);
  const [userMap, setUserMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated()) {
          const user = await getUserProfile();
          setIsAdmin(user.role === 'admin');
        }
        const data = await listFiles(skip, limit);
        setFiles(data || []);
        setTotalFiles(data.length === limit ? skip + limit + 1 : skip + data.length);

        const uniqueUserIds = [...new Set(data.map(file => file.user_id))];
        const userPromises = uniqueUserIds.map(id => getUserById(id));
        const users = await Promise.all(userPromises);
        const newUserMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
        setUserMap(newUserMap);
      } catch (err) {
        setError(err.message || 'Error loading files');
      }
    };
    fetchData();
  }, [skip, limit]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadProgress(0);
      const uploadedFile = await uploadFile(file, true);
      setFiles([uploadedFile, ...files]);
      setTotalFiles(totalFiles + 1);

      const user = await getUserById(uploadedFile.user_id);
      setUserMap(prev => ({ ...prev, [user.id]: user }));
      setUploadProgress(0);
    } catch (err) {
      setError(err.message || 'Error uploading file');
      setUploadProgress(0);
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const blob = await downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError(err.message || 'Error downloading file');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('آیا مطمئن هستید که می‌خواهید این فایل را حذف کنید؟')) {
      return;
    }

    try {
      await deleteFile(fileId);
      setFiles(files.filter(file => file.id !== fileId));
      setTotalFiles(totalFiles - 1);
    } catch (err) {
      setError(err.message || 'خطا در حذف فایل');
    }
  };

  const handleDoubleClickCopy = (url) => {
    navigator.clipboard.writeText(url)
      .then(() => alert('لینک تصویر محصول کپی شد!'))
      .catch(err => setError('خطا در کپی کردن لینک: ' + err.message));
  };

  const renderFilePreview = (file) => {
    if (!file.download_url || !file.content_type) return null;

    if (file.content_type.startsWith('image/')) {
      return (
        <img
          src={file.download_url}
          alt={file.original_filename}
          className="max-h-48 rounded object-contain border"
        />
      );
    }

    if (file.content_type.startsWith('video/')) {
      return (
        <video
          controls
          className="max-h-48 rounded border"
        >
          <source src={file.download_url} type={file.content_type} />
          مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
        </video>
      );
    }

    if (file.content_type.startsWith('text/') || file.content_type === 'application/json') {
      return (
        <iframe
          src={file.download_url}
          className="w-full h-48 border rounded"
          title={file.original_filename}
        ></iframe>
      );
    }

    return (
      <div className="text-gray-500 text-sm italic">
        پیش‌نمایش برای این نوع فایل پشتیبانی نمی‌شود.
      </div>
    );
  };

  const filteredFiles = files.filter(file => 
    file.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (direction) => {
    if (direction === 'next' && skip + limit < totalFiles) {
      setSkip(skip + limit);
    } else if (direction === 'prev' && skip > 0) {
      setSkip(skip - limit);
    }
  };

  const getUserDisplayName = (userId) => {
    const user = userMap[userId];
    if (!user) return `کاربر #${userId}`;
    if (user.name && user.last_name) return `${user.name} ${user.last_name}`;
    return user.username || `کاربر #${userId}`;
  };

  if (isAdmin === false) return <Navigate to="/" />;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;

  return (
    <div css={containerStyles}>
      <Navbar />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">مدیریت فایل‌ها</h1>
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="file-upload"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition cursor-pointer"
            >
              آپلود فایل
            </label>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute top-full left-0 w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        <input
          type="text"
          placeholder="جستجوی فایل..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          css={searchBarStyles}
        />

        <div css={fileSectionStyles}>
          <h2 css={fileTitleStyles}>همه فایل‌ها</h2>
          {filteredFiles.length === 0 ? (
            <p className="text-gray-500">فایلی یافت نشد</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <div key={file.id} css={fileCardStyles}>
                  <div css={fileContentStyles}>
                    <div css={fileDetailsStyles}>
                      <h3 className="font-medium text-gray-800 truncate">
                        {file.original_filename}
                      </h3>
                      <p className="text-sm text-gray-500">
                        حجم: {Math.round(file.size / 1024)} KB
                      </p>
                      <p className="text-sm text-gray-500">
                        تاریخ آپلود: {moment(file.upload_date, 'YYYY/MM/DD').locale('fa').format('YYYY/MM/DD')}
                      </p>
                      <p className="text-sm text-gray-500">
                        آپلود شده توسط: {getUserDisplayName(file.user_id)}
                      </p>
                      {file.download_url && (
                        <>
                          <p className="text-sm text-gray-500 truncate">
                            لینک دانلود: <a href={file.download_url} target="_blank" rel="noopener noreferrer">مشاهده</a>
                          </p>
                          <p
                            css={linkStyles}
                            onDoubleClick={() => handleDoubleClickCopy(file.download_url)}
                            title="برای کپی کردن دوبار کلیک کنید"
                          >
                            {file.download_url}
                          </p>
                        </>
                      )}
                    </div>
                    <div css={buttonContainerStyles}>
                      <button
                        css={downloadButtonStyles}
                        onClick={() => handleDownload(file.id, file.original_filename)}
                      >
                        دانلود
                      </button>
                      {(isAdmin || userMap[file.user_id]?.id === file.user_id) && (
                        <button
                          css={deleteButtonStyles}
                          onClick={() => handleDelete(file.id)}
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    {renderFilePreview(file)}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded ${file.public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {file.public ? 'عمومی' : 'خصوصی'}
                    </span>
                    <span className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-800">
                      نوع: {file.content_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div css={paginationStyles}>
            <button
              css={buttonStyles}
              onClick={() => handlePageChange('prev')}
              disabled={skip === 0}
            >
              قبلی
            </button>
            <span>
              صفحه {Math.floor(skip / limit) + 1} از {Math.ceil(totalFiles / limit)}
            </span>
            <button
              css={buttonStyles}
              onClick={() => handlePageChange('next')}
              disabled={skip + limit >= totalFiles}
            >
              بعدی
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManager;