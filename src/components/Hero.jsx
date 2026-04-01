import React from "react";
import { motion } from "framer-motion";
import "./Hero.css";

function Hero() {
  return (
    <motion.div
      className="hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="hero-content">
        <motion.h1
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Quality Kitchen and Home Essentials
        </motion.h1>
        <motion.p
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          Affordable, durable product design to elevate your everyday home experience. Curated for the modern lifestyle.
        </motion.p>
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <button>Shop Now</button>
          <button>ORDER VIA WHATSAPP</button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Hero;