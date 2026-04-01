import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>About Araire Ventures</h4>
          <p>Your trusted partner for quality kitchen and home essentials. We're committed to providing affordable, durable products that elevate your everyday experience.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#kitchen">Kitchen</a></li>
            <li><a href="#appliances">Appliances</a></li>
            <li><a href="#kids">Kids</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>Email: info@araire-ventures.com</p>
          <p>Phone: +234 7035532047</p>
          <p>WhatsApp: +234 7035532047</p>
        </div>

        <div className="footer-section">
          <h4>Follow Us</h4>
          <div className="social-links">
            <a href="#">Facebook</a>
            <a href="#">Instagram</a>
            <a href="#">Twitter</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Araire Ventures. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;