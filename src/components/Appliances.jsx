import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { useProducts } from '../contexts/ProductContext';
import { useToast } from '../contexts/ToastContext';
import './Appliances.css';

function Appliances() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToCart } = useCart();
  const { getProductsByCategory } = useProducts();
  const { addToast } = useToast();
  const appliancesProducts = getProductsByCategory('Appliances');

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();
    try {
      await addToCart(product);
      addToast(`${product.name} added to cart.`, 'success');
    } catch (error) {
      addToast(`Could not add ${product.name}: ${error.message}`, 'error');
    }
  };

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

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.floor(rating)) + (rating % 1 !== 0 ? '✨' : '');
  };



  return (
    <section className="appliances">
      <div className="appliances-wrapper">
        <motion.div
          className="appliances-header"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2>Home Appliances</h2>
          <p>Discover reliable and efficient appliances for your home</p>
          <button className="mobile-explore-btn">Explore Appliances</button>
        </motion.div>

        <motion.div
          className="products-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {appliancesProducts.map((product) => (
            <motion.div
              key={product.id}
              className="product-card"
              variants={itemVariants}
              whileHover={{ y: -8 }}
              onClick={() => setSelectedProduct(product)}
            >
              <div className="product-image-wrapper">
                <img src={product.image} alt={product.name} />
                <div className="product-badge">BUY</div>
              </div>
              
              <div className="product-info">
                <h3>{product.name}</h3>
                <div className="product-rating">
                  <span>{renderStars(product.rating)}</span>
                  <span className="rating-value">{product.rating}</span>
                </div>
                <p className="product-price">#{product.price}</p>
                <button 
                  className="add-to-cart-btn-product" 
                  onClick={(e) => handleAddToCart(product, e)}
                >
                  🛒 Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
          {appliancesProducts.length === 0 && <p className="catalog-empty-state">No appliance products are available yet.</p>}
        </motion.div>
      </div>

      {selectedProduct && (
        <motion.div
          className="product-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedProduct(null)}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={() => setSelectedProduct(null)}>✕</button>
            <img src={selectedProduct.image} alt={selectedProduct.name} />
            <div className="modal-info">
              <h2>{selectedProduct.name}</h2>
              <p className="modal-price">{selectedProduct.price}</p>
              <p className="modal-rating">{renderStars(selectedProduct.rating)} {selectedProduct.rating}/5</p>
                <button 
                className="modal-add-btn" 
                onClick={(e) => handleAddToCart(selectedProduct, e)}
              >
                🛒 Add to Cart
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}

export default Appliances;