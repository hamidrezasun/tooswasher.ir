import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Menu from './components/Menu';
import PageList from './components/page/PageList';
import PageCreate from './components/page/PageCreate';
import PageUpdate from './components/page/PageUpdate';
import PageDetail from './components/page/PageDetail';
import Login from './components/Login';
import Register from './components/Register';
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
            <Route path="/page/pages" element={<PageList refreshMenu={refreshMenu} />} />
            <Route path="/page/create" element={<PageCreate refreshMenu={refreshMenu} />} />
            <Route path="/page/:pageId" element={<PageDetail />} />
            <Route path="/page/update/:pageId" element={<PageUpdate refreshMenu={refreshMenu} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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