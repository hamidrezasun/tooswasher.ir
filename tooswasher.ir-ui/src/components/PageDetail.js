import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPage } from '../api';

const PageDetail = ({ page: propPage }) => {
  const { pageId } = useParams();
  const [page, setPage] = useState(propPage || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!propPage && pageId) {  // Fetch only if no page prop is provided
      getPage(pageId)
        .then((data) => setPage(data))
        .catch(() => setError('Failed to load page'));
    }
  }, [pageId, propPage]);

  if (error) return <p>{error}</p>;
  if (!page) return <p>Loading...</p>;

  return (
    <div>
      <h2>{page.name}</h2>
      <p>{page.body}</p>
      <p>In Menu: {page.is_in_menu ? 'Yes' : 'No'}</p>
    </div>
  );
};

export default PageDetail;