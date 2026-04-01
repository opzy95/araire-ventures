import React from 'react';
import './About.css';

function About() {
  return (
    <section className="about">
      <div className="about-container">
        <h2>About Araire Ventures</h2>
        <p className="about-intro">
          Welcome to Araire Ventures - Your trusted partner for quality kitchen and home essentials.
        </p>
        
        <div className="about-content">
          <div className="about-section">
            <h3>Our Mission</h3>
            <p>
              At Araire Ventures, we believe that a well-equipped home enhances your quality of life. 
              Our mission is to provide affordable, durable, and high-quality products that elevate your 
              everyday home experience. We're committed to offering the best value for your money.
            </p>
          </div>
          
          <div className="about-section">
            <h3>What We Offer</h3>
            <p>
              We curate a diverse range of products across multiple categories including kitchen essentials, 
              home appliances, and kids' products. Each item is carefully selected to meet our standards of 
              quality, durability, and affordability. Whether you're furnishing a new home or upgrading your 
              current space, we have something for everyone.
            </p>
          </div>
          
          <div className="about-section">
            <h3>Why Choose Us</h3>
            <p>
              With Araire Ventures, you get more than just products - you get peace of mind. Our dedication 
              to customer satisfaction, competitive pricing, and modern design means you're always getting 
              the best deal. We stand behind every product we sell.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;