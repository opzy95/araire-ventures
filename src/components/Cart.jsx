import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { FaWhatsapp, FaQrcode, FaTimes } from 'react-icons/fa';
import QRCode from 'qrcode';
import './Cart.css';

function Cart() {
  const { items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Detect screen size
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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

  const handleQuantityChange = (id, newQuantity) => {
    updateQuantity(id, parseInt(newQuantity));
  };

  // ✅ Build WhatsApp URL with order details
  const buildWhatsAppUrl = () => {
    const totalPrice = getTotalPrice();
    const orderSummary = items
      .map(
        (item) =>
          `${item.name} (x${item.quantity}) - ₦${(
            parseFloat(item.price.replace('₦', '').replace(',', '')) * item.quantity
          ).toLocaleString()}`
      )
      .join('\n');

    const message = `Hello! I'd like to place an order:\n\n${orderSummary}\n\nTotal: ₦${totalPrice.toLocaleString()}\n\nPlease confirm my order.`;
    return `https://wa.me/2347035532047?text=${encodeURIComponent(message)}`;
  };

  // ✅ Generate QR code whenever modal opens or items change
  useEffect(() => {
    if (showQR) {
      QRCode.toDataURL(buildWhatsAppUrl(), { width: 220, margin: 2 })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [showQR, items]);

  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    if (isMobile) {
      window.open(buildWhatsAppUrl(), '_blank'); // ✅ direct WhatsApp on mobile
    } else {
      setShowQR(true); // ✅ show QR modal on desktop
    }
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
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
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

                {/* ✅ QR icon on desktop, WhatsApp icon on mobile */}
                <button className="whatsapp-order-btn" onClick={handlePlaceOrder}>
                  {isMobile ? <FaWhatsapp /> : <FaQrcode />}
                  {isMobile ? ' Order via WhatsApp' : ' Scan to Order'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ✅ QR Code Modal — desktop only */}
      {showQR && (
        <>
          <div className="qr-backdrop" onClick={() => setShowQR(false)} />
          <div className="qr-modal">
            <button className="qr-close" onClick={() => setShowQR(false)}>
              <FaTimes />
            </button>
            <FaWhatsapp className="qr-wa-icon" />
            <h3>Scan to Order on WhatsApp</h3>
            <p>Open your phone camera and scan the QR code</p>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="WhatsApp QR Code" className="qr-image" />
            )}
            <span className="qr-hint">Points directly to our WhatsApp chat with your order</span>
          </div>
        </>
      )}
    </>
  );
}

export default Cart;