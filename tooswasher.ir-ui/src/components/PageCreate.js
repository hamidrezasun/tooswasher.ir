import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPage } from '../api';
import 'grapesjs/dist/css/grapes.min.css';
import { GrapesjsReact } from 'grapesjs-react';

const PageCreate = ({ refreshMenu }) => {
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [isInMenu, setIsInMenu] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();  // Replaced useHistory with useNavigate

  const handleSubmit = (e) => {
    e.preventDefault();
    createPage({ name, body, is_in_menu: isInMenu })
      .then(() => {
        refreshMenu();
        navigate('/pages');  // Replaced history.push with navigate
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to create page'));
  };

  return (
    <div>
      <h2>Create Page</h2>
      {error && <p>{error}</p>}
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
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default PageCreate;