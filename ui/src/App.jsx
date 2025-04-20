import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import Product from './pages/Product';
import CategoryProducts from './pages/CategoryProducts';
import AdminDiscounts from './pages/admin/AdminDiscounts';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategory';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Pages from './pages/Pages';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPages from './pages/admin/AdminPages';
import AdminFile from './pages/admin/AdminFile';
import AdminOption from './pages/admin/AdminOption';
import AdminOrder from './pages/admin/AdminOrder';
import Order from './pages/Order';
import UserOrders from './pages/UserOrders';
import WorkflowTemplates from './pages/admin/WorkflowTemplates';
import AdminWorkflows from './pages/admin/AdminWorkflows';
import { getOptionByName } from './api/api';

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
      } catch (error) {
        console.error("Failed to fetch title options:", error);
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
        <Route path="/admin/order" element={<AdminOrder />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetails />} />
        <Route path="/pages/:pageName" element={<Pages />} />
        <Route path="/order" element={<Order />} />
        <Route path="/orders" element={<UserOrders />} />
        <Route path="/admin/workflow/templates" element={<WorkflowTemplates />} />
        <Route path="/admin/workflow/" element={<AdminWorkflows />} />
        <Route path="*" element={<div className="text-center mt-20">صفحه یافت نشد (404)</div>} />
      </Routes>
    </Router>
  );
}

export default App;