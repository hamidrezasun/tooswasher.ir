import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Menu from './components/Menu';
import PageList from './components/PageList';
import PageCreate from './components/PageCreate';
import PageUpdate from './components/PageUpdate';
import PageDetail from './components/PageDetail';
import { getPages } from './api';
import './App.css';

const App = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuPages, setMenuPages] = useState([]);
  const refreshMenu = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    getPages()
      .then((data) => {
        // Filter pages where is_in_menu is true
        const filteredPages = data.filter((page) => page.is_in_menu);
        setMenuPages(filteredPages);
      })
      .catch((err) => console.error('Failed to fetch pages for routes:', err));
  }, [refreshKey]);

  return (
    <Router>
      <div className="app">
        <Menu refreshKey={refreshKey} />
        <div className="content">
          <Routes>
            <Route path="/" element={<h1>Welcome</h1>} />
            <Route path="/pages" element={<PageList refreshMenu={refreshMenu} />} />
            <Route path="/create" element={<PageCreate refreshMenu={refreshMenu} />} />
            <Route path="/pages/:pageId" element={<PageDetail />} />
            <Route path="/update/:pageId" element={<PageUpdate refreshMenu={refreshMenu} />} />
            {/* Dynamic routes for pages with is_in_menu: true */}
            {menuPages.map((page) => (
              <Route
                key={page.id}
                path={`/${page.name.toLowerCase().replace(/\s+/g, '-')}`}  // e.g., /about-us
                element={<PageDetail page={page} />}  // Pass page data directly
              />
            ))}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;