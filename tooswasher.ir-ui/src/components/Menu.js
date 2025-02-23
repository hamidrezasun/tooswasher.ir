import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { getPages } from '../api';

const Menu = ({ refreshKey }) => {
  const [menuPages, setMenuPages] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPages()
      .then((data) => {
        setMenuPages(data.filter((page) => page.is_in_menu));
      })
      .catch((err) => {
        console.error('Failed to fetch pages:', err);
        setError('Could not load menu pages');
      });
  }, [refreshKey]);

  return (
    <nav className="menu">
      <div className="menu-container">
        <button className="menu-button">
          <NavLink to="/" exact activeClassName="active">
            Home
          </NavLink>
        </button>
        <button className="menu-button">
          <NavLink to="/pages" activeClassName="active">
            Page List
          </NavLink>
        </button>
        <button className="menu-button">
          <NavLink to="/create" activeClassName="active">
            Create Page
          </NavLink>
        </button>
        {error ? (
          <span className="menu-error">{error}</span>
        ) : (
          menuPages.map((page) => (
            <button key={page.id} className="menu-button">
              <NavLink
                to={`/${page.name.toLowerCase().replace(/\s+/g, '-')}`}  // Match route path
                activeClassName="active"
              >
                {page.name}
              </NavLink>
            </button>
          ))
        )}
      </div>
    </nav>
  );
};

export default Menu;