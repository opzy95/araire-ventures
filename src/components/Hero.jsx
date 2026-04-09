import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import "./Hero.css";

function TypewriterText({ sentence, speed = 600 }) {
  const words = sentence.trim().split(/\s+/);
  const [hidden, setHidden] = useState(new Set());
  const timerRef = useRef(null);

  useEffect(() => {
    let hiddenCount = 0;
    let erasing = true;

    const tick = () => {
      if (erasing) {
        if (hiddenCount < words.length) {
          hiddenCount++;
          setHidden(
            new Set(
              Array.from({ length: hiddenCount }, (_, i) => words.length - 1 - i)
            )
          );
          timerRef.current = setTimeout(tick, speed);
        } else {
          erasing = false;
          timerRef.current = setTimeout(tick, speed * 1.5);
        }
      } else {
        if (hiddenCount > 0) {
          hiddenCount--;
          setHidden(
            new Set(
              Array.from({ length: hiddenCount }, (_, i) => words.length - 1 - i)
            )
          );
          timerRef.current = setTimeout(tick, speed);
        } else {
          erasing = true;
          timerRef.current = setTimeout(tick, speed * 3);
        }
      }
    };

    timerRef.current = setTimeout(tick, speed * 2);
    return () => clearTimeout(timerRef.current);
  }, [sentence, speed]);

  return (
    <>
      {words.map((word, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            marginRight: "0.3em",
            transition: "opacity 0.3s ease, transform 0.3s ease",
            opacity: hidden.has(i) ? 0 : 1,
            transform: hidden.has(i) ? "translateY(-8px)" : "translateY(0)",
          }}
        >
          {word}
        </span>
      ))}
    </>
  );
}

function Hero() {
  return (
    <motion.div
      className="hero"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="hero-content">

        {/* ✅ TypewriterText sits inside the existing motion.h1 */}
        <motion.h1
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          style={{ display: "flex", flexWrap: "wrap" }}
        >
          <TypewriterText
            sentence="Quality Kitchen and Home Essentials"
            speed={500}
          />
        </motion.h1>

        <motion.p
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          Affordable, durable product design to elevate your everyday home
          experience. Curated for the modern lifestyle.
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