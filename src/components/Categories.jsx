import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import data from '../data.json';
import './Categories.css';

function Categories() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  const handleExplore = (categoryName) => {
    if (categoryName.toLowerCase() === 'kitchen') {
      navigate('/kitchen');
    } else if (categoryName.toLowerCase() === 'appliances') {
      navigate('/appliances');
    } else if (categoryName.toLowerCase() === 'others') {
      navigate('/others');
    }
  };

  return (
    <section className="categories">
      <div className="categories-wrapper">
        <motion.div
          className="categories-header"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2>Shop by Category</h2>
          <p>Explore our curated collection of quality products</p>
        </motion.div>

        <motion.div
          className="categories-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {data.categories.map((category, index) => (
            <motion.div
              key={index}
              className="category-card"
              variants={itemVariants}
              whileHover={{ y: -10 }}
            >
              <div className="category-image-wrapper">
                <img src={category.image} alt={category.name} />
                <div className="category-overlay">
                  <button className="explore-btn" onClick={() => handleExplore(category.name)}>
                    Explore
                  </button>
                </div>
              </div>
              <div className="category-content">
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Categories;