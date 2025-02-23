import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPages, deletePage } from '../api';

const PageList = ({ refreshMenu }) => {
  const [pages, setPages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPages()
      .then((data) => setPages(data))
      .catch((err) => setError('Failed to load pages'));
  }, []);

  const handleDelete = (pageId) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      deletePage(pageId)
        .then(() => {
          setPages(pages.filter((page) => page.id !== pageId));
          refreshMenu();
        })
        .catch(() => setError('Failed to delete page'));
    }
  };

  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Pages</h2>
      <ul>
        {pages.map((page) => (
          <li key={page.id}>
            <Link to={`/pages/${page.id}`}>{page.name}</Link>
            {' | '}
            <Link to={`/update/${page.id}`}>Edit</Link>
            {' | '}
            <button onClick={() => handleDelete(page.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PageList;