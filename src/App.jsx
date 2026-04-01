import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import Kitchen from './components/Kitchen';
import Appliances from './components/Appliances';
import Kids from './components/Kids';
import About from './components/About';
import Footer from './components/Footer';
import Cart from './components/Cart';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <Navbar />
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
              <Route path="/cart" element={<Cart />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </CartProvider>
    </ToastProvider>
  );
}

export default App;