import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPage, updatePage } from '../api';
import { GrapesjsReact } from 'grapesjs-react';

const PageUpdate = ({ refreshMenu }) => {
  const { pageId } = useParams();
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [isInMenu, setIsInMenu] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();  // Replaced useHistory with useNavigate

  useEffect(() => {
    getPage(pageId)
      .then((data) => {
        setName(data.name);
        setBody(data.body);
        setIsInMenu(data.is_in_menu);
      })
      .catch(() => setError('Failed to load page'));
  }, [pageId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePage(pageId, { name, body, is_in_menu: isInMenu })
      .then(() => {
        refreshMenu();
        navigate('/pages');  // Replaced history.push with navigate
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to update page'));
  };

  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Update Page</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Body:</label>
          <GrapesjsReact
            value={body}
            id="page-builder"
            plugins={[]}
            storageManager={{ autosave: false }}
            canvas={{ styles: ['https://example.com/styles.css'] }}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isInMenu}
              onChange={(e) => setIsInMenu(e.target.checked)}
            />
            Show in Menu
          </label>
        </div>
        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default PageUpdate;