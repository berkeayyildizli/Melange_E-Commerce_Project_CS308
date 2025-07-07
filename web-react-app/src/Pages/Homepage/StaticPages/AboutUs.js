import React from 'react';
import { Link } from 'react-router-dom';
import './AboutUs.css';
import logo from './logo.png'; // Import the logo image

const AboutUs = () => {
  return (
    <div className="about-us-page">
      {/* Header with logo */}
      <header className="about-us-header">
        <Link to="/" className="logo-link">
          <img
            src={logo} // Use the imported logo here
            alt="Mèlange Logo"
            className="about-us-logo"
          />
        </Link>
      </header>

      {/* About Us Content */}
      <div className="about-us-container">
        <h1>About Us</h1>
        <p>
          Welcome to <strong>Mèlange</strong>, your ultimate destination for timeless fashion and curated designs. At <strong>Mèlange</strong>, we believe that clothing is more than just fabric—it's an expression of individuality, culture, and lifestyle. Our mission is to bring you the finest collections that blend style, quality, and affordability. Whether you're looking for everyday essentials, statement pieces, or luxury designs, Mèlange is here to inspire your wardrobe.
        </p>
        <p>
          Founded with a vision to redefine online shopping, <strong>Mèlange</strong> combines modern technology with a passion for craftsmanship to deliver a seamless shopping experience. Every product in our collection is handpicked, ensuring that it meets the highest standards of quality and design. From sustainable materials to innovative production techniques, we prioritize sustainability and ethical practices in everything we do.
        </p>
        <p>
          Our team of fashion enthusiasts works tirelessly to stay ahead of the trends, ensuring that we bring you the latest styles before anyone else. At the same time, we honor classic designs, offering a range of timeless pieces that never go out of fashion. With fast shipping, hassle-free returns, and responsive customer service, we strive to make every shopping experience memorable and stress-free.
        </p>
        <p>
          <strong>Disclaimer:</strong> While this site may look and feel like a real store, please note that Mèlange is a project and <strong>not a real business.</strong> This website was developed for educational and demonstration purposes, and no actual purchases can be made. Thank you for visiting and exploring our project!
        </p>
      </div>
    </div>
  );
};

export default AboutUs;
