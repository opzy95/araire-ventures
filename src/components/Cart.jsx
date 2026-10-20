import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import OrderCheckout from './OrderCheckout';
import './Cart.css';

function getPrice(price) {
  const amount = Number(String(price ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

function Cart() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    items,
    removeFromCart,
    updateQuantity,
    getTotalPrice,
    getTotalItems,
    clearCart,
    loading: isCartLoading,
    error: cartError,
    loadError: cartLoadError,
  } = useCart();
  const { token } = useAuth();
  const [showCheckout, setShowCheckout] = useState(() => Boolean(location.state?.openCheckout));
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!location.state?.openCheckout) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } },
  };

  const handleQuantityChange = async (id, newQuantity) => {
    const quantity = Number.parseInt(newQuantity, 10);
    if (!Number.isInteger(quantity) || quantity <= 0) return;
    setActionError('');
    try {
      await updateQuantity(id, quantity);
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleRemove = async (id) => {
    setActionError('');
    try {
      await removeFromCart(id);
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handleClearCart = async () => {
    setActionError('');
    try {
      await clearCart();
    } catch (error) {
      setActionError(error.message);
    }
  };

  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    if (token) {
      setShowCheckout(true);
    } else {
      navigate('/login', {
        state: {
          from: '/cart',
          continueCheckout: true,
          message: 'Sign in or create an account to continue with your order.',
        },
      });
    }
  };

  if (isCartLoading) {
    return (
      <section className="cart">
        <div className="cart-wrapper">
          <div className="empty-cart" role="status"><p>Loading your cart…</p></div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="cart">
        <div className="cart-wrapper">
          <motion.div
            className="empty-cart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {cartLoadError
              ? <p className="cart-error" role="alert">Could not load your cart: {cartLoadError}</p>
              : <h2>Your Cart is Empty</h2>}
            {!cartLoadError && <p>Add some products to get started!</p>}
            {(cartError || actionError) && <p className="cart-error" role="alert">{actionError || cartError}</p>}
            <Link to="/shop" className="continue-shopping-btn">Continue Shopping</Link>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="cart">
        <div className="cart-wrapper">
          <motion.div
            className="cart-header"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2>Your Shopping Cart</h2>
            <p>{getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in your cart</p>
          </motion.div>

          {(cartError || actionError || cartLoadError) && (
          <p className="cart-error" role="alert">{actionError || cartError || cartLoadError}</p>
          )}

          <motion.div
            className="cart-content"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="cart-items">
              {items.map((item) => (
                <motion.div key={item.id} className="cart-item" variants={itemVariants}>
                  <div className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>

                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <p className="cart-item-price">{item.price}</p>
                  </div>

                  <div className="cart-item-controls">
                    <div className="quantity-controls">
                      <button className="quantity-btn" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>-</button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                        className="quantity-input"
                      />
                      <button className="quantity-btn" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => handleRemove(item.id)}>Remove</button>
                  </div>

                  <div className="cart-item-total">
                    ₦{(getPrice(item.price) * item.quantity).toLocaleString()}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-total">
                <h3>Total: ₦{getTotalPrice().toLocaleString()}</h3>
              </div>

              <div className="cart-actions">
                <button className="clear-cart-btn" onClick={handleClearCart}>
                  Clear Cart
                </button>

                <button className="cart-checkout-btn" onClick={handlePlaceOrder}>
                  {token ? 'Proceed to checkout' : 'Sign in to checkout'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {showCheckout && <OrderCheckout onClose={() => setShowCheckout(false)} />}
    </>
  );
}

export default Cart;