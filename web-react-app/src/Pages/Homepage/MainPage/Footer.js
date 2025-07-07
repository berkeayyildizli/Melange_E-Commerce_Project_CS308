// src/components/Footer/Footer.js
import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__links">
        <a href="/about" className="footer__link">About Us</a>
        <a href="/faq" className="footer__link">FAQ</a>
        <a href="/contact" className="footer__link">Contact</a>
      </div>

      <div className="footer__socials">
        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer__social-link">
          <i className="fab fa-instagram"></i>
        </a>
        <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer__social-link">
          <i className="fab fa-facebook"></i>
        </a>
        <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer__social-link">
          <i className="fab fa-twitter"></i>
        </a>
        <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="footer__social-link">
          <i className="fab fa-tiktok"></i>
        </a>
        <a href="https://snapchat.com" target="_blank" rel="noreferrer" className="footer__social-link">
          <i className="fab fa-snapchat"></i>
        </a>
        <a href="https://youtube.com" target="_blank" rel="noreferrer" className="footer__social-link">
          <i className="fab fa-youtube"></i>
        </a>
        <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="footer__social-link">
          <i className="fab fa-pinterest"></i>
        </a>
        <a href="https://spotify.com" target="_blank" rel="noreferrer" className="footer__social-link">
          <i className="fab fa-spotify"></i>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
