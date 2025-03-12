import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Products from './pages/Products';
import Product from './pages/Product';
import CategoryProducts from './pages/CategoryProducts';
import AdminDiscounts from './pages/AdminDiscounts';
import AdminProducts from './pages/AdminProducts';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Pages from './pages/Pages';
import AdminUsers from './pages/AdminUsers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:productId" element={<Product />} />
        <Route path="/categories/:categoryId" element={<CategoryProducts />} />
        <Route path="/admin/discounts" element={<AdminDiscounts />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetails />} />
        <Route path="/pages/:pageName" element={<Pages />} />
        <Route path="*" element={<div className="text-center mt-20">صفحه یافت نشد (404)</div>} />
      </Routes>
    </Router>
  );
}

export default App;