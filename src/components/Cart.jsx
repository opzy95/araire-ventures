import React from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import './Cart.css';

function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.4 },
    },
  };

  const handleQuantityChange = (id, newQuantity) => {
    updateQuantity(id, parseInt(newQuantity));
  };

  const handleWhatsAppOrder = () => {
    if (items.length === 0) return;

    const totalPrice = getTotalPrice();
    const orderSummary = items.map(item =>
      `${item.name} (x${item.quantity}) - ₦${(parseFloat(item.price.replace('₦', '').replace(',', '')) * item.quantity).toLocaleString()}`
    ).join('\n');

    const message = `Hello! I'd like to place an order:\n\n${orderSummary}\n\nTotal: ₦${totalPrice.toLocaleString()}\n\nPlease confirm my order.`;

    const whatsappUrl = `https://wa.me/2347035532047?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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
            <h2>Your Cart is Empty</h2>
            <p>Add some products to get started!</p>
            <a href="/" className="continue-shopping-btn">Continue Shopping</a>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
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
          <p>{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </motion.div>

        <motion.div
          className="cart-content"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="cart-items">
            {items.map((item) => (
              <motion.div
                key={item.id}
                className="cart-item"
                variants={itemVariants}
              >
                <div className="cart-item-image">
                  <img src={item.image} alt={item.name} />
                </div>

                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p className="cart-item-price">{item.price}</p>
                </div>

                <div className="cart-item-controls">
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      className="quantity-input"
                    />
                    <button
                      className="quantity-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="cart-item-total">
                  ₦{(parseFloat(item.price.replace('₦', '').replace(',', '')) * item.quantity).toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-total">
              <h3>Total: ₦{getTotalPrice().toLocaleString()}</h3>
            </div>

            <div className="cart-actions">
              <button className="clear-cart-btn" onClick={clearCart}>
                Clear Cart
              </button>
              <button className="whatsapp-order-btn" onClick={handleWhatsAppOrder}>
                📱 Order via WhatsApp
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Cart;