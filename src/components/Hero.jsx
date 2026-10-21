import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './Hero.css';

const slides = [
  {
    eyebrow: 'Thoughtful finds for everyday living',
    title: 'Make room for a little more joy.',
    description: 'Discover practical kitchen essentials and home comforts, thoughtfully chosen for the way you live.',
    image: '/iimage/goods3.jpeg',
    category: 'Appliances',
    path: '/appliances',
    accent: 'A better everyday',
  },
  {
    eyebrow: 'A kitchen that works beautifully',
    title: 'The little details make a home.',
    description: 'From clever storage to kitchen favourites, find useful pieces that make daily routines feel easier.',
    image: '/iimage/goods2.jpeg',
    category: 'Kitchen',
    path: '/kitchen',
    accent: 'Made for your home',
  },
  {
    eyebrow: 'Something useful for every corner',
    title: 'Find your next home favourite.',
    description: 'Explore a considered collection of home, family and lifestyle essentials at prices you will love.',
    image: '/iimage/goods1.jpeg',
    category: 'Shop',
    path: '/shop',
    accent: 'The Araire edit',
  },
  {
    eyebrow: 'Everyday comfort, thoughtfully chosen',
    title: 'Make home feel even better.',
    description: 'Shop useful little upgrades for your kitchen, home and daily routine.',
    image: '/iimage/goods4.jpeg',
    category: 'Shop',
    path: '/shop',
    accent: 'Your home, your way',
  },
];

function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (isPaused || shouldReduceMotion) return undefined;

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [isPaused, shouldReduceMotion]);

  const showSlide = (direction) => {
    setActiveSlide((current) => (current + direction + slides.length) % slides.length);
  };
  const slide = slides[activeSlide];

  return (
    <section
      className="hero"
      aria-label="Featured collections"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
    >
      <div className="hero-inner">
        <div className="hero-copy" aria-live={isPaused ? 'polite' : 'off'} aria-atomic="true">
          <AnimatePresence mode="wait">
            <motion.div
              className="hero-copy-content"
              key={activeSlide}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.35 }}
            >
              <span className="hero-eyebrow"><span />{slide.eyebrow}</span>
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
              <Link className="hero-cta" to={slide.path}>
                Explore {slide.category} <FiArrowRight aria-hidden="true" />
              </Link>
              <div className="hero-account-actions" aria-label="Store and account links">
              
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="hero-controls">
            <div className="hero-pagination" aria-label="Choose a featured collection">
              {slides.map((item, index) => (
                <button
                  key={item.category}
                  type="button"
                  className={`hero-dot${activeSlide === index ? ' active' : ''}`}
                  aria-label={`Show ${item.category} collection`}
                  aria-current={activeSlide === index ? 'true' : undefined}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
              <span className="hero-slide-number">0{activeSlide + 1} <span>/ 0{slides.length}</span></span>
            </div>
            <div className="hero-arrow-controls">
              <button type="button" aria-label="Previous collection" onClick={() => showSlide(-1)}>
                <FiChevronLeft aria-hidden="true" />
              </button>
              <button type="button" aria-label="Next collection" onClick={() => showSlide(1)}>
                <FiChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-orbit hero-visual-orbit-one" />
          <div className="hero-visual-orbit hero-visual-orbit-two" />
          <AnimatePresence mode="wait">
            <motion.div
              className="hero-image-card"
              key={slide.image}
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, x: 14 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98, x: -10 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
            >
              <img src={slide.image} alt="" />
            </motion.div>
          </AnimatePresence>
          <div className="hero-image-note">
            <span className="hero-note-mark">✳</span>
            <span>{slide.accent}</span>
          </div>
          <span className="hero-visual-label">ARAIRE VENTURES <span>•</span> CURATED WITH CARE</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;
