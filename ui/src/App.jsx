import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import Product from './pages/Product';
import CategoryProducts from './pages/CategoryProducts';
import AdminDiscounts from './pages/AdminDiscounts';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategory';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Pages from './pages/Pages';
import AdminUsers from './pages/AdminUsers';
import AdminPages from './pages/AdminPages';
import AdminFile from './pages/AdminFile';
import AdminOption from './pages/AdminOption';
import { getOptionByName } from './api/api'; // Import getOptionByName

function App() {
  const [title, setTitle] = useState("My Website"); // Default title

  useEffect(() => {
    const updateTitle = async () => {
      try {
        const companyNameOption = await getOptionByName('company_name');
        const titleOption = await getOptionByName('title');
        if (companyNameOption && titleOption) {
          setTitle(`${companyNameOption.option_value} - ${titleOption.option_value}`);
          document.title = `${companyNameOption.option_value} - ${titleOption.option_value}`;
        } else if (titleOption) {
           setTitle(titleOption.option_value);
          document.title = titleOption.option_value;
        }
         //else { //removed hardcoded default.
        //   document.title = "My Website";
        // }
      } catch (error) {
        console.error("Failed to fetch title options:", error);
        //  If fetch fails, keep default title
        // document.title = "My Website";
      }
    };

    updateTitle();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<Product />} />
        <Route path="/categories/:categoryId" element={<CategoryProducts />} />
        <Route path="/admin/discounts" element={<AdminDiscounts />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/pages" element={<AdminPages />} />
        <Route path="/admin/file" element={<AdminFile />} />
        <Route path="/admin/option" element={<AdminOption />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetails />} />
        <Route path="/pages/:pageName" element={<Pages />} />
        <Route path="*" element={<div className="text-center mt-20">صفحه یافت نشد (404)</div>} />
      </Routes>
    </Router>
  );
}

export default App;
