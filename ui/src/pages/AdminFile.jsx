/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { uploadFile, downloadFile, listFiles, getUserProfile } from '../api/api';
import { isAuthenticated } from '../api/auth';
import { containerStyles } from './style';

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
  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated()) {
          const user = await getUserProfile();
          setIsAdmin(user.role === 'admin');
        }
        const data = await listFiles();
        setFiles(data || []);
      } catch (err) {
        setError(err.message || 'Error loading files');
      }
    };
    fetchData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadProgress(0);
      const formData = new FormData();
      formData.append('file', file);

      const config = {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      };

      const uploadedFile = await uploadFile(file, false, config);
      setFiles([uploadedFile, ...files]);
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

  const filteredFiles = files.filter(file => 
    file.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800 truncate">
                        {file.original_filename}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {Math.round(file.size / 1024)} KB
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(file.upload_date).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(file.id, file.original_filename)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition text-sm"
                    >
                      دانلود
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded ${file.public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {file.public ? 'عمومی' : 'خصوصی'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileManager;