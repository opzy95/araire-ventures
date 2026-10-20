import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import Kitchen from './components/Kitchen';
import Appliances from './components/Appliances';
import Kids from './components/Kids';
import About from './components/About';
import Footer from './components/Footer';
import Cart from './components/Cart';
import StorefrontShop from './components/StorefrontShop';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProductProvider } from './contexts/ProductContext';
import { AuthProvider } from './contexts/AuthContext';
import AdminDashboard from './components/pages/AdminDashboard';
import AdminAuth, { ProtectedAdminRoute } from './components/pages/AdminAuth';
import CustomerDashboard, { ProtectedCustomerRoute } from './components/pages/CustomerDashboard';

function AppRoutes() {
  const { pathname } = useLocation();
  const isDashboard = pathname === '/admin' || pathname === '/dashboard';

  return (
    <div className="App">
      {!isDashboard && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />
              <Categories />
              <About />
            </>
          }
        />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/appliances" element={<Appliances />} />
        <Route path="/others" element={<Kids />} />
        <Route path="/shop" element={<StorefrontShop />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<AdminAuth mode="login" />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<AdminAuth mode="register" />} />
        <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
        <Route path="/dashboard" element={<ProtectedCustomerRoute><CustomerDashboard /></ProtectedCustomerRoute>} />
      </Routes>
      {!isDashboard && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <ProductProvider>
            <Router>
              <AppRoutes />
            </Router>
          </ProductProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;